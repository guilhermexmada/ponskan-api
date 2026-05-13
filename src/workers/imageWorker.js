import { Worker } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'
import sharpPipeline from '../pipelines/sharpPipeline.js'
import storageService from '../utils/storage/storageService.js'
import imagesService from '../services/imagesService.js'
import processedService from '../services/processedService.js'
import cnnService from '../services/cnnService.js'
import classificationService from '../services/classificationService.js'
import analysisService from '../services/analysisService.js'
import { timeStamp } from 'console'
import { buffer } from 'stream/consumers'
import { performance } from 'node:perf_hooks'

// inicia contador da execução do worker
const startWorker = performance.now()

const imageWorker = new Worker('analysis-queue', async (job) => {
    // extrai dados do job
    const { analysisId, userId, images } = job.data
    try {
        console.log(`>> Processando Análise ${analysisId}`)
        let analysisObject = []

        for (const image of images) {
            // envia buffer serializado para pipeline de pré-processamento
            const originalBuffer = Buffer.from(image.buffer.data)
            const processedBuffer = await sharpPipeline.preProcess(originalBuffer)

            // salva temporariamente buffer processado 
            const tempProcessedPath = await storageService.save(
                processedBuffer,
                `${analysisId}`,
                '.webp'
            )

            // salva temporariamente buffer original
            const tempOriginalPath = await storageService.save(
                originalBuffer,
                `${analysisId}`,
                '.webp'
            )
            // monta objeto para envio à CNN
            analysisObject.push({
                original: {
                    buffer: originalBuffer,
                    metadata: {
                        tempPath: tempOriginalPath,
                        name: image.originalName,
                        mimeType: image.mimeType,
                        size: image.size
                    }
                },
                processed: {
                    buffer: processedBuffer,
                    metadata: {
                        tempPath: tempProcessedPath,
                        mimeType: 'image/webp',
                        size: processedBuffer.length,
                        resolution: '[224,224]',
                        colorSpace: 'sRGB',
                        time: Date.now()
                    }
                }
            })
        }

        // inicia contador da execução da CNN
        const startCNN = performance.now()

        // aguarda inferência na CNN
        const inference = await cnnService.simulate(analysisId, analysisObject)
        console.log(`>> Análise ${analysisId} classificada com sucesso`)

        // // finaliza contador da execução da CNN
        const endCNN = performance.now()

        for (const object of analysisObject) {
            // separa imagens e versões processadas
            const processedObjectMeta = object.processed.metadata
            const originalObjectMeta = object.original.metadata
            // move arquivos temporários para pastas definitivas
            const processedPath = await storageService.move(processedObjectMeta.tempPath, 'processed', analysisId, userId)
            const originalPath = await storageService.move(originalObjectMeta.tempPath, 'uploads', analysisId, userId)
            // salva imagens no banco
            const image = await imagesService.create({
                id_analise: analysisId,
                nome: originalObjectMeta.name,
                caminho: originalPath,
                tipo_mime: originalObjectMeta.mimeType,
                tamanho: originalObjectMeta.size
            })
            const processed = await processedService.create({
                id_imagem: image.id,
                nome: originalObjectMeta.name,
                caminho: processedPath,
                tipo_mime: processedObjectMeta.mimeType,
                tamanho: processedObjectMeta.size
            })
        }
        // limpa pasta temporária (após o loop)
        await storageService.cleanTemp(`${analysisId}`)
        console.log(`>> Pasta temporária limpa com sucesso`)

        // salva classificação no banco
        const cnnExecTime = endCNN - startCNN
        const classification = await classificationService.create({
            id_analise: analysisId,
            tempo_execucao: cnnExecTime,
            classe: inference.preDiagnosis,
            confianca: inference.confidence,
            modelo_cnn: inference.cnnModel
        })

        // atualiza análise no banco
        const updatedAnalysis = await analysisService.update(analysisId, {
            status: 'finalizada'
        })

    } catch (error) {
        console.error(`>> Erro ao processar job ${job.id} : ${error.message}`)
    }
}, { connection: redisConfig })

imageWorker.on('completed', (job) => {
    // finaliza contador da execução do worker
    const endWorker = performance.now()
    const workerExecTime = endWorker - startWorker
    console.log(`>> Job ${job.id} foi completado em ${workerExecTime} ms`)
})

// imageWorker.on('ready', () => console.log('Worker conectado ao Redis e pronto!'));
// imageWorker.on('active', (job) => console.log(`Job ${job.id} iniciou processamento`));
// imageWorker.on('completed', (job) => console.log(`Job ${job.id} finalizado com sucesso`));
// imageWorker.on('failed', (job, err) => console.error(`Job ${job.id} falhou: ${err.message}`));

export default imageWorker