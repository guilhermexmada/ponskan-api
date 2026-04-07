import express from 'express'
import dotenv from 'dotenv'

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

export default app