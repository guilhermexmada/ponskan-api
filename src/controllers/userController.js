import UserService from '../services/userService.js'
import AuthService from '../services/authService.js'
import AppError from '../utils/appError.js'
import APIResponse from '../utils/apiResponse.js'
import validator from 'validator'
import bcrypt from 'bcrypt'

class UserController {
    // cadastra usuário
    async createUser(req, res, next) {
        try {
            const { name, email, password, phone, birthDate, accessType, address, cnpj, highSchool, course } = req.body

            if (!name || !email || !password) {
                throw new AppError('Campos obrigatórios não preenchidos', 400)
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
    // loga usuário com email e senha
    async loginUser(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                throw new AppError('Campos obrigatórios não preenchidos', 400)
            }

            const login = await AuthService.login(email, password)
            
            const token = login.token
            const user = login.user

            const result = {
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }
            
            return new APIResponse(res, 'Login realizado com sucesso', 200, result)
        } catch (error) {
            next(error)
        }
    }
    // consulta usuário por ID
    async getUser(req, res, next) {
        try {
            const id = req.params.id
            if (!id) {
                throw new AppError('ID do usuário não informado', 400)
            }
            // valida formato da ID
            if (validator.isUUID(id)) {
                const result = await UserService.getOne(id)
                return new APIResponse(res, 'Usuário encontrado com sucesso', 200, result)
            } else {
                throw new AppError('ID do usuário é inválido', 400)
            }
        } catch (error) {
            next(error)
        }
    }
}

export default new UserController()