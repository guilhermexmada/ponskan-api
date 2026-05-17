import multer from 'multer'
import uploadConfig from '../config/multer-config.js'
import AppError from '../utils/appError.js'

const uploadMiddleware = (req, res, next) => {
    const upload = uploadConfig.array('images', 4)

    // callback assíncrono -> next(new AppError)
    upload(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {
                // erros específicos do Multer
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return next(new AppError('Limite máximo de 4 imagens atingido', 400, { code: err.code }))
                } else if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new AppError('A imagem é muito grande (máximo 5MB)', 400, { code: err.code }))
                }
            } else {
                // erro de tipo do arquivo
                if (err.message === 'INVALID_MIME_TYPE') {
                    return next(new AppError('Tipo de arquivo inválido: são aceitos JPG, PNG e WebP', 400, { code: err.message }))
                } else {
                    return next(new AppError('Não foi possível completar o upload: erro interno no servidor', 500))
                }
            }
        }
        // sem erros, segue p/ controller   
        next()
    })
}

export default uploadMiddleware