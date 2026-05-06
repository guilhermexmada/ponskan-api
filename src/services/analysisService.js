import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'

class AnalysisService {
    async initAnalysis(userID, files) {
        return {
            status: 'Em andamento'
        }
    }
}

export default new AnalysisService()