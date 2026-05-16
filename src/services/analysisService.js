import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'
import imageQueue from '../queues/imageQueue.js'

class AnalysisService {
    async create(userId, files) {
        // cria entidade pai
        const analysis = await Analise.create({ id_usuario: userId })
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
        await imageQueue.add('analysis-job', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: '3000'
            },
            removeOnComplete: 50,
            removeOnFail: 20
        })

        return analysis
    }
    async update(analysisId, data) {
        if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }
        if (!data) {
            throw new AppError('Erro ao enviar dados para atualização da análise', 400)
        }
        const updatedAnalysis = await Analise.update(data, {
            where: {
                id: analysisId
            }
        })
        return {
            id: analysisId,
            userId: updatedAnalysis.id_usuario,
            status: updatedAnalysis.status
        }
    }
    async get(analysisId) {
        if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }
        const analysis = await Analise.findByPk(analysisId)
        return analysis
    }
}

export default new AnalysisService()