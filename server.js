import app from './app.js'

const port = process.env.PORT || 4040

async function startServer() {
    try {
        // inicia servidor 
        const server = app.listen(port, () => {
            console.log(`>> Aplicação iniciada ... Servidor rodando em http://localhost:${port}`)
        })
    } catch (error) {
        console.error('>> Falha ao iniciar a aplicação: ', error)
        process.exit(1)
    }
}

startServer()