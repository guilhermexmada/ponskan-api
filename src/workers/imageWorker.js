import { Worker } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'
import { performance } from 'node:perf_hooks'
import * as services from '../services/index.js'
import storageService from '../utils/storage/storageService.js'
import preProcess from '../pipelines/preProcess.js'

const imageWorker = new Worker('analysis-queue', async (job) => {
    try {
        // dispara contador do worker
        const startWorker = performance.now()
        // extrai dados do job
        const { analysisId, userId, images } = job.data
        let analysisObject = []

        console.log(`>> Processando Análise ${analysisId} ... Tentativa ${job.attemptsMade + 1}`)

        // para cada foto
        for (const image of images) {
            // envia buffer serializado para pré-processamento
            const originalBuffer = Buffer.from(image.buffer.data)
            const processedBuffer = await preProcess.preProcess(originalBuffer)

            // salva buffers temporariamente
            const tempProcessedPath = await storageService.save(
                processedBuffer,
                `${analysisId}`,
                '.webp'
            )
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
                        size: processedBuffer.length
                    }
                }
            })
        }

        // inicia contador da CNN
        const startCNN = performance.now()

        // aguarda inferência na CNN
        const inference = await services.cnnService.simulate(analysisId, analysisObject)
        console.log(`>> Análise ${analysisId} classificada com sucesso`)

        // finaliza contador da CNN
        const endCNN = performance.now()

        // para cada conjunto de foto + versões processadas
        for (const object of analysisObject) {
            // separa imagens e versões processadas
            const processedMeta = object.processed.metadata
            const imageMeta = object.original.metadata
            // move arquivos temporários para pastas definitivas
            const processedPath = await storageService.move(processedMeta.tempPath, 'processed', analysisId, userId)
            const originalPath = await storageService.move(imageMeta.tempPath, 'uploads', analysisId, userId)
            // cadastra imagens no banco
            const image = await services.imagesService.create({
                id_analise: analysisId,
                nome: imageMeta.name,
                caminho: originalPath,
                tipo_mime: imageMeta.mimeType,
                tamanho: imageMeta.size
            })
            const processed = await services.processedService.create({
                id_imagem: image.id,
                nome: imageMeta.name,
                caminho: processedPath,
                tipo_mime: processedMeta.mimeType,
                tamanho: processedMeta.size
            })
        }

        // limpa pasta temporária (após o loop)
        await storageService.cleanTemp(`${analysisId}`)
        console.log(`>> Pasta temporária limpa com sucesso`)

        // cadastra classificação no banco
        const cnnExecTime = endCNN - startCNN
        const classification = await services.classificationService.create({
            id_analise: analysisId,
            tempo_execucao: cnnExecTime,
            classe: inference.preDiagnosis,
            confianca: inference.confidence,
            modelo_cnn: inference.model
        })
        // finaliza contador de performance do job
        const endWorker = performance.now()
        const workerExecTime = endWorker - startWorker
        console.log(`>> Job ${job.id} foi completado em ${workerExecTime} ms`)
    } catch (error) {
        console.error(`>> Erro ao processar job ${job.id} : ${error.message}`)
        throw error // informa BullMQ que job falhou -> após todas as tentativas, chama job.on('failed')
    }
}, { connection: redisConfig })

// job concluído
imageWorker.on('completed', async (job) => {
    try {
        const { analysisId } = job.data
        // atualiza análise no banco
        const completeAnaluysis = await services.analysisService.update(analysisId, {
            status: 'finalizada'
        })
    } catch (error) {
        console.error('>> Erro ao atualizar progresso da análise: ', error)
    }
})

// job falhou
imageWorker.on('failed', async (job, err) => {
    try {
        const { analysisId } = job.data
        // atualiza análise no banco
        const cancelAnalysis = await services.analysisService.update(analysisId, {
            status: 'cancelada'
        })
    } catch (error) {
        console.error('>> Erro ao atualizar progresso da análise: ', error)
    } finally {
        console.error(`>> Job ${job.id} falhou: ${err.message}`)
    }
})

// imageWorker.on('ready', () => console.log('Worker conectado ao Redis e pronto!'));
// imageWorker.on('active', (job) => console.log(`Job ${job.id} iniciou processamento`));

export default imageWorker