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
}

export default new AuthController()