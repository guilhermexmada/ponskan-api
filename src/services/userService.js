import { where } from 'sequelize'
import Usuario from '../models/Usuario.js'
import AppError from '../utils/appError.js'

class UserService {
    async create(data) {
        if (!data) {
            throw new AppError('Erro ao enviar dados do usuário', 400)
        }
        // verifica se usuário já existe
        const exists = await this.existsByEmail(data.email)
        if (exists == false) {
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
            throw new AppError('Erro ao enviar identificador do usuário', 400)
        }
        const user = await Usuario.findByPk(id)
        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        } else {
            return user
        }
    }
    async existsByEmail(email) {
        if (!email) {
            throw new AppError('Erro ao enviar e-mail do usuário', 400)
        }
        const user = await Usuario.findOne(
            {
                where: { email: email }
            }
        )
        return !!user // transforma em booleano (existe = true, não existe = false)
    }
    async findByEmail(email) {
        if (!email) {
            throw new AppError('Erro ao enviar e-mail do usuário', 400)
        }
        const user = await Usuario.findOne(
            {
                where: { email: email }
            }
        )
        return {
            id: user.id,
            email: user.email,
            password: user.senha,
        }
    }
}

export default new UserService()