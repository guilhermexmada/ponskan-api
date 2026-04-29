import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import UserService from './userService.js'
import AppError from '../utils/appError.js'
import APIResponse from '../utils/apiResponse.js'

class AuthService {
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