import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'
import imageQueue from '../queues/imageQueue.js'

class AnalysisService {
    async initAnalysis(userId, files) {
        // cria entidade pai
        const analysis = await Analise.create({ id_usuario: userId })

        // prepara dados para fila do BullMQ
        // buffers + metadados
        const jobData = {
            analysisId: analysis.id,
            files: files.map(f => ({
                buffer: f.buffer,
                originalName: f.originalName,
                mimeType: f.mimeType
            }))
        }

        // adiciona à fila de processamento (Sharp + CNN)
        await imageQueue.add('processar-imagens', jobData)

        return analysis
    }
}

export default new AnalysisService()