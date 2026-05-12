import { Worker } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'
import sharpPipeline from '../pipelines/sharpPipeline.js'
import storageService from '../utils/storage/storageService.js'
import imagesService from '../services/imagesService.js'
import processedService from '../services/processedService.js'
import cnnService from '../services/cnnService.js'
import { timeStamp } from 'console'
import { buffer } from 'stream/consumers'

const imageWorker = new Worker('analysis-queue', async (job) => {
    // extrai dados do job
    const { analysisId, userId, images } = job.data
    try {
        console.log(`>> Processando Análise ${analysisId}`)
        let analysisObject = []
        let imagesObject = []

        for (const image of images) {
            // envia buffer serializado para pipeline de pré-processamento
            const originalBuffer = Buffer.from(image.buffer.data)
            const processedBuffer = await sharpPipeline.preProcess(originalBuffer)

            // salva temporariamente buffer processado 
            const tempProcessedPath = await storageService.save(
                processedBuffer,
                `temp/${analysisId}`,
                '.webp'
            )

            // salva temporariamente buffer original
            const tempOriginalPath = await storageService.save(
                originalBuffer,
                `temp/${analysisId}`,
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

        // aguarda inferência na CNN
        const inference = await cnnService.simulate(analysisId, analysisObject)
        console.log(`>> Análise ${analysisId} classificada com sucesso`)

        if (inference.blackSpot === true) {
            for (const object of analysisObject) {
                // separa imagens e versões processadas
                const processedObject = object.processed
                const originalObject = object.original
                // move arquivos temporários para pastas definitivas
                const processedPath = await storageService.move(processedObject.metadata.tempPath, 'processed', analysisId, userId)
                const originalPath = await storageService.move(originalObject.metadata.tempPath, 'uploads', analysisId, userId)

                // salva imagens no banco
                // const meta = object.metadata
                // const uploadedImage = await imagesService.create({
                //     id_analise: analysisId,
                //     nome: meta.originalName,
                //     caminho: uploadedPath,
                //     tipo_mime: meta.originalMimeType,
                //     tamanho: meta.size
                // })
                // const processedImage = await processedService.create({
                //     id_imagem: uploadedImage.id,
                //     nome: meta.originalName,
                //     caminho: processedPath,
                //     tipo_mime: meta.mimeType,
                //     tamanho: meta.size
                // })
            }
            // limpa pasta temporária
            await storageService.cleanTemp(`${analysisId}`)
            console.log(`>> Pasta temporária limpa com sucesso`)
        }
    } catch (error) {
        console.error(`>> Erro ao processar job ${job.id} : ${error.message}`)
    }
}, { connection: redisConfig })

// imageWorker.on('ready', () => console.log('Worker conectado ao Redis e pronto!'));
// imageWorker.on('active', (job) => console.log(`Job ${job.id} iniciou processamento`));
// imageWorker.on('completed', (job) => console.log(`Job ${job.id} finalizado com sucesso`));
// imageWorker.on('failed', (job, err) => console.error(`Job ${job.id} falhou: ${err.message}`));

export default imageWorker