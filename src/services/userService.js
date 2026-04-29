import { where } from 'sequelize'
import Usuario from '../models/Usuario.js'
import AppError from '../utils/appError.js'

class UserService {
    async create(data) {
        if (!data) {
            throw new AppError('Erro ao enviar dados do usuário', 401)
        }
        // verifica se usuário já existe
        const findUser = await this.findByEmail(data.email)
        if (findUser == false) {
            const user = await Usuario.create(data)
            return {
                id: user.id,
                name: user.nome,
                email: user.email
            }
        } else {
            throw new AppError('Já existe uma conta com esse endereço de e-mail', 401)
        }
    }
    async getOne(id) {
        if (!id) {
            throw new AppError('Erro ao enviar identificador do usuário', 401)
        }
        const user = await Usuario.findByPk(id)
        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        } else {
            return user
        }
    }
    async findByEmail(email) {
        if (!email) {
            throw new AppError('Erro ao enviar e-mail do usuário', 401)
        }
        const user = await Usuario.findOne(
            {
                where: { email: email }
            }
        )
        return !!user // transforma em booleano (existe = true, não existe = false)
    }
}

export default new UserService()