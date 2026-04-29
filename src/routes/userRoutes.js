import express from 'express'
import UserController from '../controllers/userController.js'

const router = express.Router()

router.post('/user', UserController.createUser) // criar conta de usuário

router.get('/user/:id', UserController.getUser) // buscar usuário por ID

export default router