import express from 'express'
import healthRoutes from './src/routes/healthRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import analysisRoutes from './src/routes/analysisRoutes.js'
import errorMiddleware from './src/middlewares/errorMiddleware.js'

const app = express()

// configurações express
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// rotas
app.get('/', (req, res) => {
    res.send('Hello, world!')
})
app.use('/', healthRoutes)
app.use('/', userRoutes)
app.use('/', analysisRoutes)

// define middleware como última camada de tratamento de erros
app.use(errorMiddleware)

export default app