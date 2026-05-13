import sharp from 'sharp'

class SharpPipeline {
    async preProcess(buffer) {

        let pipeline = await sharp(buffer)

        // redimensionamento
        pipeline.resize(224, 224, {
            fit: 'cover',
            position: 'center'
        })

        // redução de ruído com leve desfoque
        pipeline.blur(0.5)

        // ajuste de contraste e brilho
        pipeline.modulate({
            brightness: 1.05,
            saturation: 1.2
        })

        // conversão de cores e formato
        pipeline.toColorspace('srgb')
        pipeline.webp({
            quality: 90,
            compressionLevel: 9
        })

        // output
        const processedBuffer = pipeline.toBuffer()
        return processedBuffer  
    }
    async simulateTraining(buffer) {
        // simula data augmentation
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
        // simula normalização
        const finalImages = await Promise.all(variations.map(v =>
            v.grayscale()
                .normalise()
                .toBuffer()
        ))

        return finalImages
    }
    async simulateClassification(buffers) {
        const probabilities = []
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

                // regra simulada: conta pixels necróticos (baixos valores em todos os canais)
                if (r < 30 && g < 30 && b < 30) {
                    count++
                }
            }

            // simula probabilidade
            // console.log('total de pixels: ', totalPixels)
            // console.log('pixels escuros: ', count)
            const density = (count / totalPixels) * 100
            const prob = Math.min(density / 2, 1) // normaliza entre 0 e 1, considera 5% = alta probabilidade, 1 = trava de segurança (clamping)
            probabilities.push(prob)
        }

        // média final (ensemble averaging) das variações de uma imagem
        const score = probabilities.reduce((a, b) => a + b, 0) / probabilities.length

        return score
    }
}

export default new SharpPipeline()