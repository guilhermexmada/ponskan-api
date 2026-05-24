import analysisService from "../services/analysisService.js"
import imagesService from "../services/imagesService.js"
import classificationService from "../services/classificationService.js"
import APIResponse from '../utils/apiResponse.js'
import AppError from '../utils/appError.js'

class AnalysisController {
    // inicia análise de fotos
    async initAnalysis(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id
            const files = req.files

            if (!userId) {
                throw new AppError('Usuário não autenticado', 403)
            }

            if (!files || files.length === 0) {
                throw new AppError('Nenhuma imagem enviada', 400)
            }

            // retorna análise 'pendente', dispara fila de processamento paralela
            const result = await analysisService.create(userId, files)

            return new APIResponse(res, 'Análise iniciada', 202, result)
        } catch (error) {
            next(error)
        }
    }
    // verifica progresso da análise
    async getPolling(req, res, next) {
        try {
            const analysisId = req.params.id

            if (!analysisId) {
                throw new AppError('Erro ao enviar ID da análise referente', 400)
            }

            const analysis = await analysisService.get(analysisId)

            if (analysis.status === 'pendente') {
                return new APIResponse(res, 'A análise ainda está sendo processada', 200, analysis)
            } else if (analysis.status === 'cancelada') {
                return new APIResponse(res, 'A análise foi cancelada devido a algum erro', 500, analysis)
            } else if (analysis.status === 'finalizada') {
                // se estiver 'finalizada', retorna relatório completo
                const images = await imagesService.getByAnalysis(analysisId)
                const classification = await classificationService.getByAnalysis(analysisId)

                const result = {
                    analysis,
                    images,
                    classification
                }

                return new APIResponse(res, 'Relatório da Análise consultado com sucesso', 200, result)
            }
        } catch (error) {
            next(error)
        }
    }
    // lista análises do usuário
    async getAllAnalysis(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id
            // requer número da página
            const page = req.query.page || 1

            const analysisList = await analysisService.getAll(userId, page)
            const result = analysisList
            return new APIResponse(res, 'Listagem de Análises realizada com sucesso', 200, result)
        } catch (error) {
            next(error)
        }
    }
}

export default new AnalysisController()