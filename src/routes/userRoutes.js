import express from 'express'
import UserController from '../controllers/userController.js'
import AuthController from '../controllers/authController.js'

const router = express.Router()

router.post('/user', UserController.createUser) // criar conta de usuário

router.post('/login', AuthController.loginUser) // logar com email e senha

router.get('/user/:id', UserController.getUser) // buscar usuário por ID

export default router