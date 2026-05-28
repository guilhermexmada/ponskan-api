import { where } from 'sequelize'
import Usuario from '../models/Usuario.js'
import AppError from '../utils/appError.js'

class UserService {
    // cadastra usuário novo
    async create(data) {
        if (!data) {
            throw new AppError('Erro ao enviar dados do usuário', 400)
        }
        // verifica se usuário já existe
        const exists = await this.existsByEmail(data.email)
        // se não existir, cria
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
    // consulta usuário por ID
    async getOne(userId) {
        if (!userId) {
            throw new AppError('Erro ao enviar ID do usuário', 400)
        }
        const user = await Usuario.findByPk(userId, {
            attributes: {
                exclude: ['senha']
            }
        })
        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        } else {
            return user
        }
    }
    // verifica se usuário existe por email
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
    // busca usuário por email
    async findByEmail(email) {
        if (!email) {
            throw new AppError('Erro ao enviar e-mail do usuário', 400)
        }
        const user = await Usuario.findOne(
            {
                where: { email: email }
            }
        )
        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        }
        return {
            id: user.id,
            email: user.email,
            name: user.nome,
            password: user.senha,
        }
    }
    // atualiza dados do usuário
    async update(userId, data) {
        if (!userId) {
            throw new AppError('Erro ao enviar ID do usuário', 400)
        }
        if (!data) {
            throw new AppError('Erro ao enviar novos dados do usuário', 400)
        }
        const user = await Usuario.update(data, { where: { id: userId } })
        if (!user) {
            throw new AppError('Não foi possível atualizar dados do usuário. Erro interno do servidor.', 500)
        }
        const updatedUser = await Usuario.findByPk(userId)

        return updatedUser
    }
    // desativa usuário
    async delete(userId) {
        if (!userId) {
            throw new AppError('Erro ao enviar ID do usuário', 400)
        }
        // realiza deleção lógica por causa do paranoid
        const user = await Usuario.destroy({
            where: {
                id: userId
            }
        })
    }
}

export default new UserService()