import healthService from "../services/healthService.js"

class HealthController {
    async healthCheck(req, res) {
        try {
            const result = await healthService.test()
            if (!result) {
                res.status(503).json({ success: false, message: 'Serviço indisponível' })
            }
            res.status(200).json({ success: true, message: 'Serviço disponível', data: result })
        } catch (error) {
            console.error('Erro ao testar saúde da API: ', error)
            res.status(500).json({ success: false, message: 'Erro ao testar saúde da API', error: error })
        }
    }
}

export default new HealthController()