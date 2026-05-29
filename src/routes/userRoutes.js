import express from 'express'
import UserController from '../controllers/userController.js'
import Authorization from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/user', UserController.createUser) // cadastrar usuário + logar

router.post('/login', UserController.loginUser) // logar com email e senha

router.get('/user', Authorization, UserController.getUser) // buscar usuário por ID

router.put('/user', Authorization, UserController.updateUser) // atualiza dados do usuário

router.delete('/user', Authorization, UserController.deleteUser) // exclui usuário

export default router