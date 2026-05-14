import analysisService from "../services/analysisService.js"
import imagesService from "../services/imagesService.js"
import classificationService from "../services/classificationService.js"
import APIResponse from '../utils/apiResponse.js'
import AppError from '../utils/appError.js'

class AnalysisController {
    async initAnalysis(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const user_id = loggedUser.id
            const files = req.files

            if (!files || files.length === 0) {
                throw new AppError('Nenhuma imagem enviada', 400)
            }

            const result = await analysisService.create(user_id, files)

            return new APIResponse(res, 'Análise iniciada', 201, result)
        } catch (error) {
            next(error)
        }
    }
    async getPolling(req, res, next) {
        try {
            const analysis_id  = req.params.id

            const analysis = await analysisService.get(analysis_id)

            if (analysis.status === 'pendente') {
                return new APIResponse(res, 'A análise ainda está sendo processada', 200, analysis)
            } else if (analysis.status === 'cancelada') {
                return new APIResponse(res, 'A análise foi cancelada devido a algum erro', 500, analysis)
            } else if (analysis.status === 'finalizada') {
                const images = await imagesService.getByAnalysis(analysis_id)
                const classification = await classificationService.getByAnalysis(analysis_id)

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
}

export default new AnalysisController()