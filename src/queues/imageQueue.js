import { Queue } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'

const imageQueue = new Queue('analysis-queue', {
    connection: redisConfig
})

export default imageQueue