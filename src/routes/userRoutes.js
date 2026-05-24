import express from 'express'
import UserController from '../controllers/userController.js'

const router = express.Router()

router.post('/user', UserController.createUser) // cadastrar usuário + logar

router.post('/login', UserController.loginUser) // logar com email e senha

router.get('/user/:id', UserController.getUser) // buscar usuário por ID

export default router