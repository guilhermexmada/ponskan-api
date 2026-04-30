import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import UserService from './userService.js'
import AppError from '../utils/appError.js'
import APIResponse from '../utils/apiResponse.js'

class AuthService {
    async login(email, password) {
        if (!email || !password) {
            throw new AppError('Erro ao enviar e-mail ou senha', 400)
        }

        // verifica se usuário existe e busca senha+id
        const user = await UserService.findByEmail(email)
        if (!user) {
            throw new AppError('Suas credenciais são inválidas: verifique e tente novamente', 401)
        }

        // verifica senha
        const isMatch = await bcrypt.compare(password, user.password)
        
        // se correta, gera token
        if (!isMatch) {
            throw new AppError('Suas credenciais são inválidas: verifique e tente novamente', 401)
        }
        const token = this.generateToken(user.id, user.email)
        return token
    }
    async hashPassword(password) {
        const salt = await bcrypt.genSaltSync(10)
        const hash = await bcrypt.hashSync(password, salt)
        return hash
    }
    async generateToken(id, email) {
        try {
            const token = jwt.sign(
                { id, email }, process.env.JWT_SECRET, { expiresIn: '1h' }
            )
            return token
        } catch (error) {
            throw new AppError('Não foi possível gerar o token de autenticação', 400)
        }
    }
}

export default new AuthService()