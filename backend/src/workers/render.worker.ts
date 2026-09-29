import {Worker} from 'bullmq';
import { redisConnection } from '../config/redis.config.js';
import { processManim } from '../processors/render.processor.js';
import { renderQueue } from '../queues/render.queue.js';


export const renderWorker = new Worker('render-queue',
     processManim,
     
     {
    connection : redisConnection
},
)



 export async function testpipeline(code :String , userId:String , threadId?:String )  {



    console.log("inside pipeline of the worker !!")
    await renderQueue.add('renderWorker',
    {
        userId:userId,
        code:code,
        threadId: threadId,

    }
)
 }

