import IORedis from 'ioredis'

// Factory de conexões com Redis
function createRedisConnection(customConfig = {}) {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
        console.log('[Redis] Variáveis de ambiente do Redis não foram definidas')
    }
    const baseConfig = {
        // captura variáveis de conexão
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number(process.env.REDIS_DB || 0),
        // estratégia de reconexão padrão
        retryStrategy: (times) => {
            // se falhar +3 vezes seguidas, assume que Redis está offline
            if (times > 3) {
                console.error('\n>> [Redis] Sua conexão com Redis está inacessível')
                redis.disconnect() // fecha a conexão
                return null // IORedis desiste do loop de reconexão
            }

            const delay = Math.min(times * 5000, 15000) // loop de reconexão de 5s a 15s
            console.log(`>> [Redis] Tentando reconectar ${connName}... Tentativa (${times})`)
            return delay
        }
    }
    // mescla configuração padrão com configuração customizada (usa operador spread)
    const finalConfig = { ...baseConfig, ...customConfig } // cria novo objeto somando os 2 objetos de configuração (se já existir uma propriedade, a última sobrescreve a primeira)
    // instancia conexão
    const redis = new IORedis(finalConfig)

    // captura nome personalizado da conexão
    const connName = finalConfig.connectionName || 'Cliente Geral da API'

    // centraliza logs de eventos (serve para qualquer conexão criada na factory)
    redis.on('connect', () => {
        console.log(`>> [Redis] Uma nova conexão foi bem-sucedida: ${connName}`)
    })

    redis.on('error', (err) => {
        // erros de rede e infraestrutura
        switch (err.code) {
            case 'ECONNREFUSED':
                console.error(`>> [Redis] Conexão recusada em ${connName}: ${err.code}`)
                return
            case 'ETIMEDOUT':
                console.error(`>> [Redis] Timeout de conexão em ${connName}: ${err.code}`)
                return
            case 'ENOTFOUND':
                console.error(`>> [Redis] DNS/Host não encontrado em ${connName}: ${err.code}`)
                return
        }
        // erros internos do Redis
        const msg = err.message || ''
        if (msg.includes('OOM')) {
            console.error(`>> [Redis] Limite de memória excedido em ${connName}`)
        } else if (msg.includes('READONLY')) {
            console.error(`>> [Redis] Instância somente para leitura em ${connName}`)
        } else {
            console.error(`>> [Redis] Erro em ${connName}: ${msg}`)
        }
    })

    return redis
}

// Cliente Singleton (uso geral na API)
// const redisClient = createRedisConnection()

export { /*redisClient,*/ createRedisConnection }

