import AppError from '../utils/appError.js'

class HealthService {
    async test() {
        try {
            return {
                api: 'rodando',
                uptime: process.uptime(),
                timestamp: new Date()
            }
        } catch (error) {
            throw new AppError('Erro ao testar saúde da API', 500)
        }
    }
}

export default new HealthService()