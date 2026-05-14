import Imagem from '../models/Imagem.js'
import AppError from '../utils/appError.js'

class ImageService {
    async create(data) {
        try {
            if (!data) {
                throw new AppError('Erro ao enviar dados da imagem', 400)
            }
            const image = await Imagem.create(data)
            return {
                id: image.id,
                name: image.nome,
                path: image.caminho,
            }
        } catch (error) {
            throw new AppError('Não foi possível salvar a imagem: erro interno do servidor')
        }
    }
    async getByAnalysis(analysisId){
         if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }
        const images = await Imagem.findAll({
            where: {
                id_analise: analysisId
            }
        })
        return images
    }
}

export default new ImageService()