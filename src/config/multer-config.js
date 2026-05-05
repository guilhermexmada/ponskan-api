import multer from 'multer'
import path from 'path'

// armazenamento em memória RAM (buffer)
const storage = multer.memoryStorage()

// filtro de mime-types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('INVALID_MIME_TYPE'))
    }
}

const uploadConfig = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // limite de 5mb
        files: 4 // máximo de 4 arquivos
    }
})

export default uploadConfig