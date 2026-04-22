import app from './app.js'
import { initDatabase } from './src/database/initDB.js'

const port = process.env.PORT || 4040

async function startServer() {
    try {

        await initDatabase() // inicia banco de dados

        // inicia servidor 
        const server = app.listen(port, () => {
            console.log(`>> Aplicação iniciada ... Servidor rodando em http://localhost:${port}`)
        })
        // tratamento de erros
        // erro conhecido
        server.on('error', (err) => {
            console.error(`Erro ao iniciar o servidor: ${err}`)
            process.exit(1)
        })

        // sem try catch
        server.on('uncaughtException', (err) => {
            console.error(`Exceção não capturada: ${err}`)
            process.exit(1)
        })

        // promise rejeitada
        process.on('unhandledRejection', (reason) => {
            console.error('Rejeição não tratada:', reason);
            process.exit(1);
        });

        // grateful shutdown
        process.on('SIGTERM', async () => {
            console.log('Encerrando servidor...');

            await sequelize.close()

            server.close(() => {
                console.log('Servidor encerrado corretamente');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('>> Falha ao iniciar a aplicação: ', error)
        process.exit(1)
    }
}

startServer()