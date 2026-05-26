import simulateCNN from '../pipelines/simulateCNN.js'

// simula inferência da rede neural
class CNNService {
    async simulate(analysisId, data) {
        try {
            if (!analysisId) {
                console.error('>> Erro ao enviar ID da Análise referente')
            }
            if (!data) {
                console.error('>> Erro ao enviar dados para classificação')
            }

            console.log(`>> Iniciando classificação da Análise ${analysisId} com ${data.length} imagens`)

            // gera array com probabilidade de cada imagem processada
            let scores = [];
            for (const object of data) {
                const buffer = object.processed.buffer
                const variations = await simulateCNN.simulateTraining(buffer) // simula data augmentation
                const probability = await simulateCNN.simulateClassification(variations) // simula classificação
                scores.push(probability)
            }

            // média final das probabilidades
            const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length
            // define limiar e classe binária
            const preDiagnosis = finalScore >= 0.8 ? 'true' : 'false'
            // cálculo da confiança por probabilidade complementar
            const confidence = preDiagnosis === 'true' ? finalScore : (1 - finalScore)

            await new Promise(resolve => setTimeout(resolve, 5000)) // delay artificial
            console.log(`Existe ${confidence * 100}% de chance da amostra ser ${preDiagnosis === 'true' ? 'infectada' : 'saudável'}`)

            return {
                confidence,
                preDiagnosis,
                model: 'simulation'
            }

        } catch (error) {
            console.error(`>> Erro ao classificar análise: ${error}`)
        }
    }
}

export default new CNNService()