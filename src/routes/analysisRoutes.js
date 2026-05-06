import express from 'express'
import Authorization from '../middlewares/authMiddleware.js'
import analysisController from '../controllers/analysisController.js'
import uploadMiddleware from '../middlewares/uploadMiddleware.js'

const router = express.Router()

router.post('/analysis', Authorization, uploadMiddleware, analysisController.store) // inicia análise de imagem

export default router