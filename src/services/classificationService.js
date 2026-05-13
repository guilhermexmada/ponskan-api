import Classificacao from '../models/Classificacao.js'

class ClassificationService {
    async create(data){
        try {
            if(!data){
                throw new AppError('Erro ao enviar dados da classificação', 400)
            }
            const classification = await Classificacao.create(data)
            return {
                id: classification.id,
                preDiagnosis: classification.classe,
                confidence: classification.confianca
            }
        } catch (error) {
            throw new AppError('Não foi possível salvar a classificação: erro interno do servidor')
        }
    }
}

export default new ClassificationService()