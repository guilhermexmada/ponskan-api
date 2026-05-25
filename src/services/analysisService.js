import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'
import imageQueue from '../queues/imageQueue.js'
import Classificacao from '../models/Classificacao.js'
import Imagem from '../models/Imagem.js'
import { fn, col, literal } from 'sequelize'

class AnalysisService {
    // cadastra análise e dispara fila assíncrona de classificação
    async create(userId, files) {
        // cadastra análise 'pendente'
        const analysis = await Analise.create({ id_usuario: userId })

        // prepara dados do job
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

        // adiciona job à fila
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
    // atualiza estado de progresso da análise
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
    // consulta análise por ID
    async get(analysisId) {
        if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }

        const analysis = await Analise.findByPk(analysisId)

        if (!analysis) {
            throw new AppError('Nenhuma análise foi encontrada', 404)
        }

        return analysis
    }
    // consulta relatório completo e paginado da análise
    async getAll(userId, page = 1) {
        if (!userId) {
            throw new AppError('Erro ao enviar ID do usuário referente', 400)
        }
        // parâmetros de paginação
        const limit = 20
        const offset = (page - 1) * limit

        const analysisList = await Analise.findAll({
            attributes: [
                'id',
                'status',
                'createdAt',
                // subquery para contar imagens
                [
                    literal(`(
                    SELECT COUNT(*)
                    FROM imagens AS imagem
                    WHERE imagem.id_analise = Analises.id
                )`),
                    'imagesCount'
                ]
            ],
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Classificacao,
                    as: 'classificacao',
                    attributes: ['id', 'classe', 'confianca', 'tempo_execucao', 'createdAt']
                },
                {
                    model: Imagem,
                    as: 'imagem',
                    attributes: []
                }
            ],
            where: {
                id_usuario: userId
            },
            limit,
            offset
        })
        return analysisList
    }
}

export default new AnalysisService()