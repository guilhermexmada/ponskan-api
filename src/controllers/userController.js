import UserService from '../services/userService.js'
import AuthService from '../services/authService.js'
import AppError from '../utils/appError.js'
import APIResponse from '../utils/apiResponse.js'
import validator from 'validator'

class UserController {
    async createUser(req, res, next) {
        try {
            const { name, email, password, phone, birthDate, accessType, address, cnpj, highSchool, course } = req.body

            if (!name || !email || !password) {
                throw new AppError('Campos obrigatórios não preenchidos', 401)
            }

            // hasheia senha
            const hash = await AuthService.hashPassword(password)

            const user = await UserService.create({
                nome: name,
                email: email,
                senha: hash,
                telefone: phone,
                data_nascimento: birthDate,
                tipo_acesso: accessType,
                endereco: address,
                cnpj: cnpj,
                faculdade: highSchool,
                curso: course
            })

            // gera token de autenticação
            const token = await AuthService.generateToken(user.id, user.email)

            // monta objeto de resposta
            const result = {
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }

            return new APIResponse(res, 'Usuário cadastrado com sucesso', 201, result)
        } catch (error) {
            next(error)
        }
    }
    async getUser(req, res, next) {
        try {
            const id = req.params.id
            if (!id) {
                throw new AppError('ID do usuário não informado', 401)
            }
            // valida formato da ID
            if (validator.isUUID(id)) {
                const result = await UserService.getOne(id)
                return new APIResponse(res, 'Usuário encontrado com sucesso', 200, result)
            } else {
                throw new AppError('ID do usuário é inválido', 401)
            }
        } catch (error) {
            next(error)
        }
    }
}

export default new UserController()