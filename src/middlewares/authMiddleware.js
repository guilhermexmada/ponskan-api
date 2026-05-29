import jwt from 'jsonwebtoken'
import AppError from '../utils/appError.js'
import { Usuario } from '../models/index.js'

const Authorization = async (req, res, next) => {
    const authHeader = req.headers['authorization']

    // verifica se header existe e segue padrão Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Acesso não autorizado: token não fornecido ou mal formatado', 401))
    }

    // extrai token do header "Authorization: Bearer seu_token_jwt"
    const splitedHeader = authHeader.split(' ')
    const token = splitedHeader[1]

    try {
        // Verifica se o token é válido e decodifica os dados (Forma linear/síncrona)
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Soft delete check
        const usuario = await Usuario.findByPk(decoded.id)
        console.log(usuario)
        if (!usuario) {
            return next(new AppError('Acesso não autorizado: usuário desativado ou inexistente', 401))
        }

        // Caso o usuário exista e esteja ativo, anexa dados úteis à requisição
        req.token = token
        req.loggedUser = {
            id: decoded.id,
            email: decoded.email
        }

        // prossegue requisição
        next()

    } catch (error) {
        // Trata os erros específicos do pacote jsonwebtoken dentro do fluxo catch
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Acesso não autorizado: token expirado', 401))
        }
        
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Acesso não autorizado: token inválido', 401))
        }

        // flutua erros inesperados
        next(error)
    }
}

export default Authorization