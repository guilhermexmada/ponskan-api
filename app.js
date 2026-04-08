import express from 'express'
import dotenv from 'dotenv'
import healthRoutes from './src/routes/healthRoutes.js'

dotenv.config()
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

export default app