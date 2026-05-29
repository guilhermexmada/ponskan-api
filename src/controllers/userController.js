import UserService from '../services/userService.js'
import AuthService from '../services/authService.js'
import AppError from '../utils/appError.js'
import APIResponse from '../utils/apiResponse.js'
import validator from 'validator'
import bcrypt from 'bcrypt'
import userService from '../services/userService.js'

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
    // consulta dados do usuário
    async getUser(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id
            if (!userId) {
                throw new AppError('Usuário não autenticado', 401)
            }
            // valida formato da ID
            if (validator.isUUID(userId)) {
                const result = await UserService.getOne(userId)
                return new APIResponse(res, 'Usuário encontrado com sucesso', 200, result)
            } else {
                throw new AppError('ID do usuário é inválido', 400)
            }
        } catch (error) {
            next(error)
        }
    }
    // atualiza dados do usuário
    async updateUser(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id
            const { name, password, phone, birthDate, accessType, address, cnpj, highSchool, course } = req.body

            if (!userId) {
                throw new AppError('Usuário não autenticado', 401)
            }  

            // hasheia senha
            const hash = await AuthService.hashPassword(password)

            const data = {
                nome: name,
                senha: hash,
                telefone: phone,
                tipo_acesso: accessType,
                data_nascimento: birthDate,
                endereco: address,
                cnpj,
                faculdade: highSchool,
                curso: course
            }

            // valida formato da ID
            if (validator.isUUID(userId)) {
                const exists = await userService.getOne(userId)
                if(!exists){
                    throw new AppError('Usuário não encontrado', 404)
                }
                const result = await UserService.update(userId, data)
                return new APIResponse(res, 'Usuário atualizado com sucesso', 200, result)
            } else {
                throw new AppError('ID do usuário é inválido', 400)
            }
        } catch (error) {
            next(error)
        }
    }
    // desativa usuário
    async deleteUser(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id

            if (!userId) {
                throw new AppError('Usuário não autenticado', 401)
            }

            // valida formato da ID
            if (validator.isUUID(userId)) {
                const result = await UserService.delete(userId)
                return new APIResponse(res, 'Usuário excluído com sucesso', 200)
            } else {
                throw new AppError('ID do usuário é inválido', 400)
            }
        } catch (error) {
            next(error)
        }
    }
}

export default new UserController()