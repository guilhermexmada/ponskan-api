import path from 'path'
import fs from 'fs/promises' // importa módulo assíncrono do pacote
import { v4 as uuidv4 } from 'uuid'
import AppError from '../appError.js'

class StorageService {
    async save(buffer, folder, ext) {
        if (!Buffer.isBuffer(buffer)) {
            throw new AppError('Buffer inválido', 400)
        }
        // define caminho absoluto de destino
        const filename = uuidv4()
        const fullPath = path.resolve('storage', folder, `${filename}${ext}`)

        // cria pasta de destino
        await fs.mkdir(path.dirname(fullPath), { recursive: true })

        // cria arquivo webp a partir do buffer
        await fs.writeFile(fullPath, buffer)

        return fullPath
    }
    async move(fullPath, folder, analysisId, userId) {
        // consulta data de criação do arquivo
        const dt = new Date()
        const month = dt.getMonth() + 1
        const year = dt.getFullYear()
        // define caminho de destino
        const parsedPath = path.parse(fullPath)
        // caminho relativo dentro do storage
        const relativeDestination = path.join(
            'analysis',
            `${year}`,
            `${month}`,
            `${analysisId}`,
            `${userId}`,
            parsedPath.base
        )
        // caminho absoluto final
        const fullDestination = path.resolve(
            'storage',
            folder,
            relativeDestination
        )
        // cria diretório
        await fs.mkdir(path.dirname(fullDestination), {
            recursive: true
        })
        // move arquivo
        await fs.rename(fullPath, fullDestination)

        return fullDestination
    }
    async cleanTemp(folder) {
        const tempDir = path.resolve('storage', 'temp', folder)
        await fs.rm(tempDir, {
            recursive: true,
            force: true
        })
    }
}

export default new StorageService()