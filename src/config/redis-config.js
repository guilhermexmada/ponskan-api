import IORedis from 'ioredis'

/**
 * Cria uma instância do Redis com configurações padronizadas
 */
function createRedisClient() {
    const redis = new IORedis({
        host: process.env.REDIS_PORT || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,

        // configura persistência das tentativas de conexão
        maxRetriesPerRequest: null,
        // ignora check inicial para agilizar consumo
        enableReadyCheck: false,
        // define delay para conectar ao Redis
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            console.log(`>> Redis reconectando... Tentativa (${times})`)
            return delay
        }
    })

    // ao conectar
    redis.on('connect', () => {
        console.log('>> Redis conectado')
    })

    // ao falhar
    redis.on('error', (err) => {
        console.error('>> Erro ao conectar Redis: ', err)
    })

    return redis
}

/**
 * Exporta uma instância única (singleton)
 */
export const redisClient = createRedisClient()

/**
 * Exporta config pura (útil pro BullMQ)
 */

export const redisConfig = {
    host: process.env.REDIS_PORT || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
}

