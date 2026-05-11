import { Worker } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'
import sharpPipeline from '../pipelines/sharpPipeline.js'
import storageService from '../utils/storage/storageService.js'
import imagesService from '../services/imagesService.js'
import processedService from '../services/processedService.js'
import cnnService from '../services/cnnService.js'

const imageWorker = new Worker('image-processing', async (job) => {
    const { analysisId, userId, files } = job.data
    console.log(`>> Processando Análise ${analysisId}`)
    try {
        let analysisObject = []
        for (const file of files) {
            // envia buffer serializado para pipeline de pré-processamento
            const buffer = Buffer.from(file.buffer.data)
            const processedBuffer = await sharpPipeline.preProcess(buffer)

            // salva temporariamente buffer processado 
            const tempPath = await storageService.save(
                processedBuffer,
                `temp/${analysisId}`,
                '.webp'
            )

            // salva temporariamente buffer original
            const originalTempPath = await storageService.save(
                buffer,
                `temp/${analysisId}`,
                '.webp'
            )

            // monta objeto para envio à CNN
            analysisObject.push({
                buffer: processedBuffer,
                metadata: {
                    path: tempPath,
                    originalName: file.originalName,
                    originalPath: originalTempPath,
                    mimeType: 'image/webp',
                    originalMimeType: file.mimeType,
                    size: processedBuffer.length,
                    originalSize: buffer.length,
                    resolution: '[224, 224]',
                    colorspace: 'sRGB',
                    timestamp: Date.now(),
                }
            })
        }

        const simulate = await cnnService.simulate(analysisId, analysisObject)
        console.log(`>> Análise ${analysisId} classificada com sucesso`)

        if (simulate.blackSpot === true) {
            for (const object of analysisObject) {

                // move arquivos temporários para pastas definitivas
                const processedPath = await storageService.move(object.metadata.path, 'processed', analysisId, userId)
                const uploadedPath = await storageService.move(object.metadata.originalPath, 'uploads', analysisId, userId)

                // salva imagens no banco
                const meta = object.metadata
                const uploadedImage = await imagesService.create({
                    id_analise: analysisId,
                    nome: meta.originalName,
                    caminho: uploadedPath,
                    tipo_mime: meta.originalMimeType,
                    tamanho: meta.size
                })
                const processedImage = await processedService.create({
                    id_imagem: uploadedImage.id,
                    nome: meta.originalName,
                    caminho: processedPath,
                    tipo_mime: meta.mimeType,
                    tamanho: meta.size
                })
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