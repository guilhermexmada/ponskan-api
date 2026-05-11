import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'
import imageQueue from '../queues/imageQueue.js'

class AnalysisService {
    async create(userId, files) {
        // cria entidade pai
        const analysis = await Analise.create({ id_usuario: userId })

        // prepara dados para fila do BullMQ: buffer + metadados
        const jobData = {
            analysisId: analysis.id,
            userId: userId,
            files: files.map(f => ({
                buffer: f.buffer,
                originalName: f.originalname,
                mimeType: f.mimetype
            }))
        }

        // adiciona à fila de processamento (Sharp + CNN)
        await imageQueue.add('processar-imagens', jobData)

        return analysis
    }
    async update(analysisId, data) {
    }
}

export default new AnalysisService()