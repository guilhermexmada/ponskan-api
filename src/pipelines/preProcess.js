import sharp from 'sharp'

class PreProcess {
    // pré-processa fotos
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

        // retorna buffer tratado
        const output = pipeline.toBuffer()
        return output
    }
}

export default new PreProcess()