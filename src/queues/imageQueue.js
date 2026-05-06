import { Queue } from 'bullmq'
import { redisConfig } from '../config/redis-config.js'

const imageQueue = new Queue('image-processing', {
    connection: redisConfig
})

export default imageQueue