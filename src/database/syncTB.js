import { connection } from '../models/index.js' // importa a model principal

export async function syncTables() {
    try {
        await connection.sync()
        console.log('>> Tabelas criadas com sucesso')
    } catch (error) {
        console.error('>> Erro ao criar as tabelas: ', error)
    }
}