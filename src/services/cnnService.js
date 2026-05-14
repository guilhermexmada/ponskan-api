import sharp from "sharp";
import sharpPipeline from "../pipelines/sharpPipeline.js"

// simula inferência da rede neural
class CNNService {
    async simulate(analysisId, data) {
        if (!analysisId) {
            console.error('>> Erro ao enviar ID da Análise referente')
        }
        if (!data || data == undefined) {
            console.error('>> Erro ao enviar dados para classificação')
        }
        try {
            console.log(`>> Iniciando classificação da Análise ${analysisId} com ${data.length} imagens`)

            // gera array com probabilidade de cada imagem
            let scores = [];
            for (const object of data) {
                const buffer = object.processed.buffer
                const variations = await sharpPipeline.simulateTraining(buffer)
                const probability = await sharpPipeline.simulateClassification(variations)
                scores.push(probability)
            }

            // média final
            const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length

            const confidence = finalScore
            const preDiagnosis = confidence >= 0.8 ? 'true' : 'false'

            await new Promise(resolve => setTimeout(resolve, 5000)) // delay artificial

            return {
                confidence,
                preDiagnosis,
                cnnModel: 'simulation'
            }

        } catch (error) {
            console.error(`>> Erro ao classificar análise: ${error}`)
        }
    }
}

export default new CNNService()