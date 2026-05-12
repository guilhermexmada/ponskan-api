import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'
import imageQueue from '../queues/imageQueue.js'

class AnalysisService {
    async create(userId, files) {
        // cria entidade pai
        const analysis = await Analise.create({ id_usuario: userId })
        console.log(files)
        // prepara dados para fila do BullMQ: ids + buffer + metadados
        const jobData = {
            analysisId: analysis.id,
            userId: userId,
            images: files.map(file => ({
                buffer: file.buffer,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size
            }))
        }

        // adiciona job à fila de processamento (Sharp + CNN + Sequelize)
        await imageQueue.add('analysis-job', jobData)

        return analysis
    }
    async update(analysisId, data) {
    }
}

export default new AnalysisService()