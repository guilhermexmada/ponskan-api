import AuthService from '../services/authService.js'
import UserService from '../services/userService.js'
import bcrypt from 'bcrypt'
import AppError from '../utils/appError.js'
import APIResponse from '../utils/apiResponse.js'

class AuthController {
    async loginUser(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                throw new AppError('Campos obrigatórios não preenchidos', 400)
            }

            const token = await AuthService.login(email, password)

            const result = {
                token: token
            }
            
            return new APIResponse(res, 'Login realizado com sucesso', 200, result)
        } catch (error) {
            next(error)
        }
    }
}

export default new AuthController()