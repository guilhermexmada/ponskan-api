import { Worker } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'
import sharp from 'sharp'

const imageWorker = new Worker('image-processing', async (job) => {
    const { analysisId, files } = job.data
    console.log('Processando análise ', analysisId)

    for (const file of files) {
        try {
            // convertendo buffer serializado p/ buffer real
            const buffer = Buffer.from(file.buffer.data)
            // pré-processamento com sharp
            const optimizedBuffer = await sharp(buffer)
                // redimensionamento
                .resize(224, 224, {
                    fit: 'cover',
                    position: 'center'
                })
                // redução de ruído (denoising) com leve desfoque gaussiano
                .blur(0.5)
                // ajuste de contraste e brilho
                .modulate({
                    brightness: 1.05,
                    saturation: 1.2
                })
                // conversão de cores e formato
                .toColorspace('srgb')
                .png({ quality: 90, compressionLevel: 9 })
                // output
                .toBuffer()

            console.log(`Imagem ${file.originalName} otimizada com sucesso`)
        } catch (error) {
            console.error('>> Erro no Sharp: falha ao processar ', file.originalName)
        }
    }
}, { connection: redisConfig })

imageWorker.on('ready', () => console.log('Worker conectado ao Redis e pronto!'));
imageWorker.on('active', (job) => console.log(`Job ${job.id} iniciou processamento`));
imageWorker.on('completed', (job) => console.log(`Job ${job.id} finalizado com sucesso`));
imageWorker.on('failed', (job, err) => console.error(`Job ${job.id} falhou: ${err.message}`));

export default imageWorker