import { Worker } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'
import sharpPipeline from '../pipelines/sharpPipeline.js'
import storageService from '../utils/storage/storageService.js'
import { v4 as uuidv4 } from 'uuid'


const imageWorker = new Worker('image-processing', async (job) => {
    const { analysisId, files } = job.data
    console.log(`>> Processando Análise ${analysisId}`)

    try {
        let analysisObject = []
        for (const file of files) {
            // envia buffer serializado para pipeline
            const buffer = Buffer.from(file.buffer.data)
            const processedBuffer = await sharpPipeline.preProcess(buffer)

            // salva temporariamente buffer processado 
            const tempPath = await storageService.save(
                processedBuffer,
                `temp/${analysisId}`,
                `${uuidv4()}.webp`
            )

            console.log(`>> ${file.originalName} otimizada com sucesso`)

            analysisObject.push({
                buffer: processedBuffer,
                metadata: {
                    path: tempPath,
                    resolution: [224, 224],
                    colorspace: 'sRGB',
                    timestamp: Date.now()
                }
            })
        }

        console.log(analysisObject)
    } catch (error) {
        console.error(`>> Erro ao processar job ${job.id} : ${error.message}`)
    }
}, { connection: redisConfig })

// imageWorker.on('ready', () => console.log('Worker conectado ao Redis e pronto!'));
// imageWorker.on('active', (job) => console.log(`Job ${job.id} iniciou processamento`));
// imageWorker.on('completed', (job) => console.log(`Job ${job.id} finalizado com sucesso`));
// imageWorker.on('failed', (job, err) => console.error(`Job ${job.id} falhou: ${err.message}`));

export default imageWorker