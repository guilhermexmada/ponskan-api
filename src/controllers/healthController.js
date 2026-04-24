import healthService from "../services/healthService.js"
import APIResponse from "../utils/apiResponse.js"
import AppError from "../utils/appError.js"

class HealthController {
    async healthCheck(req, res, next) {
        try {
            const result = await healthService.test()
            if (!result) {
                throw new AppError('Serviço indisponível', 503)
            }
            return new APIResponse(res, 'Serviço disponível', 200, result)
        } catch (error) {
            next(error)
        }
    }
}

export default new HealthController()