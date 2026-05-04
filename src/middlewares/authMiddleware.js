import jwt from 'jsonwebtoken'
import AppError from '../utils/appError.js'

const Authorization = (req, res, next) => {
    const authHeader = req.headers['authorization']

    // verifica se header existe e segue padrão Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Acesso não autorizado: token não fornecido ou mal formatado', 401)
    }

    // extrai token do header "Authorization: Bearer seu_token_jwt"
    const splitedHeader = authHeader.split(' ')
    const token = splitedHeader[1]

    // verifica se o token é válido puxando o secret do .env
    jwt.verify(token, process.env.JWT_SECRET, (error, data) => {
        // caso inválido
        if (error) {
            // se expirou
            if (error.name === 'TokenExpiredError') {
                throw new AppError('Acesso não autorizado: token expirado', 401)
            }
            throw new AppError('Acesso não autorizado: token inválido', 401)
        }
        // caso válido
        else {
            // anexa dados úteis à requisição
            req.token = token
            req.loggedUser = {
                id: data.id,
                email: data.email
            }
            // prossegue requisição
            next()
        }
    })
}

export default Authorization