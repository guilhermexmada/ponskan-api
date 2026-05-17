import express from 'express'
import Authorization from '../middlewares/authMiddleware.js'
import analysisController from '../controllers/analysisController.js'
import uploadMiddleware from '../middlewares/uploadMiddleware.js'

const router = express.Router()

router.post('/analysis', Authorization, uploadMiddleware, analysisController.initAnalysis) // inicia análise de imagem

router.get('/analysis/:id', Authorization, analysisController.getPolling) // verifica status da análise e gera relatório

router.get('/analysis', Authorization, analysisController.getAllAnalysis) // listagem das análises

export default router