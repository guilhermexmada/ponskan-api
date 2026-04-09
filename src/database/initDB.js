import connection from "../config/sequelize-config.js"
import { createDatabaseIfNotExists } from "./createDb.js"
import '../models/index.js'

export async function initDatabase() {
    try {
        await connection.authenticate()
        console.log('>> Banco de dados conectado com sucesso')

        //await connection.sync()
        //console.log('>> Models sincronizadas')

    } catch (error) {
        // verifica se o banco não foi encontrado (1049 = Unknown database)
        if (error.original && error.original.errno === 1049) {
            await createDatabaseIfNotExists()
            await connection.authenticate()
            console.log('>> Banco de dados conectado com sucesso')
        } else {
            console.error('>> Erro ao iniciar o banco: ', error)
            process.exit(1)
        }
    }
}