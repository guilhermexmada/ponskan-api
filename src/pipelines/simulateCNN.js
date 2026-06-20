import sharp from 'sharp'

class SimulateCNN {
    // simula data augmentation
    async simulateTraining(buffer) {
        // monta array com 4 variações por imagem processada
        const variations = [
            // original padronizada
            sharp(buffer).resize(224, 224).rotate(),

            // com espelhamento
            sharp(buffer).resize(224, 224).flip().rotate(),

            // matiz alterada
            sharp(buffer).resize(224, 224).modulate({ hue: 10, brightness: 0.9 }),

            // rotação aleatória
            sharp(buffer).resize(224, 224).rotate(45)
        ]

        const output = await Promise.all(variations.map(v =>
            v.removeAlpha()
                .toColorspace('srgb')
                .toBuffer()
        ))

        return output
    }
    // simula classificação
    async simulateClassification(buffers) {
        const probabilities = []

        // para cada variação de uma imagem processada
        for (const buffer of buffers) {
            // obtém pixels brutos
            const { data, info } = await sharp(buffer)
                .removeAlpha() // remove possível transparência
                .toColorspace('srgb') // garante 3 canais
                .raw()
                .toBuffer({ resolveWithObject: true }) // entrega {data: buffer, info: metadados}

            let count = 0
            const totalPixels = info.width * info.height

            // analisa canais RGB pulando de 3 em 3 bytes
            for (let i = 0; i < data.length; i += 3) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]

                // considera luminância (padrão BT.601)
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b

                // conta pixel "escuro" se luminância for baixa
                if (luminance < 60) {
                    count++
                }
            }

            // simula probabilidade por variação
            const density = (count / totalPixels) * 100
            const prob = Math.min(density / 2, 1) // normaliza entre 0 e 1, considera 2% = alta probabilidade, 1 = trava de segurança (clamping)
            probabilities.push(prob)
        }

        // média final (ensemble averaging) das variações de uma imagem
        const score = probabilities.reduce((a, b) => a + b, 0) / probabilities.length

        return score
    }
}

export default new SimulateCNN()