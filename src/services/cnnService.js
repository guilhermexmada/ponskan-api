import sharp from "sharp";
import sharpPipeline from "../pipelines/sharpPipeline.js"

// simula inferência da rede neural
class CNNService {
    async simulate(analysisId, data) {
        try {
            console.log(`>> Iniciando classificação da Análise ${analysisId} com ${data.length} imagens`)

            // gera array com probabilidade de cada imagem
            let scores = [];
            for (const object of data) {
                const buffer = object.buffer;
                const variations = await sharpPipeline.simulateTraining(buffer);
                const imageProbability = await sharpPipeline.simulateClassification(variations);
                scores.push(imageProbability);
            }

            const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length

            const probability = (finalScore).toFixed(2)
            const blackSpot = probability >= 0.9 ? true : false
            const confidence = Math.random().toFixed(2)

            await new Promise(resolve => setTimeout(resolve, 2000))

            const inference = {
                finalScore,
                scores,
                probability,
                blackSpot,
                confidence,
                data
            }

            return inference

        } catch (error) {
            console.error(`>> Erro ao classificar análise`)
        }
    }
}

export default new CNNService()