import analysisService from "../services/analysisService.js"
import APIResponse from '../utils/apiResponse.js'
import AppError from '../utils/appError.js'

class AnalysisController {
    async store(req, res, next) {
        try {
            const { user_id } = req.body // vem do token
            const files = req.files

            if (!files || files.length === 0) {
                throw new AppError('Nenhuma imagem enviada', 400)
            }

            const result = await analysisService.initAnalysis(user_id, files)

            return new APIResponse(res, 'Análise iniciada', 201, result)
        } catch (error) {
            next(error)
        }
    }
}

export default new AnalysisController()