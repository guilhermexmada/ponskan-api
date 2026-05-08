import path from 'path'
import fs from 'fs/promises' // importa módulo assíncrono do pacote

class StorageService {
    async save(buffer, folder, filename) {
        // define caminho absoluto de destino
        const fullPath = path.resolve('storage', folder, filename)

        // cria pasta de destino
        await fs.mkdir(path.dirname(fullPath), { recursive: true })

        // cria arquivo webp a partir do buffer
        await fs.writeFile(fullPath, buffer)

        return fullPath
    }
}

export default new StorageService()