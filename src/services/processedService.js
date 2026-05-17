import Processada from '../models/Processada.js'
import AppError from '../utils/appError.js'

class ProcessedService {
    async create(data) {
        try {
            if (!data) {
                throw new AppError('Erro ao enviar dados da imagem', 400)
            }
            const image = await Processada.create(data)
            return {
                id: image.id,
                name: image.nome,
                path: image.caminho,
            }
        } catch (error) {
            throw new AppError('Não foi possível salvar a imagem: erro interno do servidor')
        }
    }
}

export default new ProcessedService()