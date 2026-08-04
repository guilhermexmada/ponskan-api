import { Queue } from 'bullmq'
import { createRedisConnection } from '../config/redis-config.js'

let imageQueue = null

function initImageQueue() {
    // se já foi iniciada
    if (imageQueue) {
        console.log(`>> [imageQueue] Queue rodando`)
        return imageQueue
    }

    // se não, cria conexão Redis exclusiva
    const queueConnection = createRedisConnection({
        maxRetriesPerRequest: null,
        connectionName: 'ImageQueue'
    })
    // instancia uma nova fila do bullmq passando conexão criada
    imageQueue = new Queue('analysis-queue', {
        connection: queueConnection,
    })

    // erro de conexão do bullmq
    imageQueue.on('error', (error) => {
        console.error('>> [ImageQueue] Erro de conexão com Redis: ', error.code)
    })

    return imageQueue
}

export default initImageQueue