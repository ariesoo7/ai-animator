import {Queue} from 'bullmq';
import { redisConnection } from '../config/redis.config.js';



export const renderQueue = new Queue('render-queue',{
    connection:redisConnection
})