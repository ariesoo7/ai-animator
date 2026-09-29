import { Router, Request, Response } from "express";
import  prisma  from "../config/db.js";
import { authenticate_user } from "../middlewares/authentication.middleware.js";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import graph from "../graph/graph.js";
import { Command } from "@langchain/langgraph";
import {
  awaitRenderedVideo,
  renderedVideoPath,
} from "./await-video.js";


const router = Router ();

router.use(authenticate_user);

router.post("/chat",async (req:Request , res :Response)=>{
    const userId = req.user?.id.toString();
    // The client may send either key; topic is the canonical one.
    const topic = String(req.body.topic ?? req.body.message ?? "").trim();

    if (!topic) {
        return res.status(400).json({
            message: "A topic is required."
        });
    }

    console.log(userId);
    console.log(topic );

    const  threadId = randomUUID();

    try{

        const data = await prisma.thread.create({
            data:{
                userId : userId,
                threadId:  threadId
            }
        });



    console.log(" thread created successfully in the data base");
    console.log(data);

    const config = {
        configurable:{
            thread_id : threadId
        }
    };

        const result = await graph.invoke(
        {
            userId,
            topic
        },
        {
            ...config,
         //   streamMode: "updates"
        }
    );

    console.log(result);


    res.json({
        storyBoard : result.storyBoard,
        // The client echoes this back so later requests hit this exact thread.
        threadId,
    })

/*   for await (const update of stream) {

    console.log("GRAPH UPDATE:", update);

    res.write(
        `data: ${JSON.stringify(update)}\n\n`
    );} */

}catch(err:any){
    console.log(err);
    res.status(500).json({
       "message": err?.message || "Could not generate a storyboard."
    })
}

});


router.post("/approve_storyboard",async ( req: Request , res:Response )=>{

    const userId = req.user?.id;
    const approved = req.body.approved ;

    if (!userId) {
        return res.status(401).json({
            message: "Not authenticated. Please sign in again."
        });
    }

    // Clear any video from a previous run so we never serve a stale file.
    if (approved) {
        await rm(renderedVideoPath(userId), { force: true });
    }

    try{

const requestedThreadId = req.body.threadId;

/*
 * Always prefer the thread the client is actually working on. Scoping by
 * userId alone would let Postgres return any of the user's threads, so an
 * older one (with a different topic) could be resumed by mistake.
 */
const data : any = requestedThreadId
    ? await prisma.thread.findFirst({
        where: {
            threadId: String(requestedThreadId),
            userId: userId,
        }
    })
    : await prisma.thread.findFirst({
        where: {
            userId: userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });

if (!data?.threadId) {
    return res.status(404).json({
        message: "No storyboard thread was found for this user."
    });
}

const threadId = String(data.threadId);
console.log(threadId);



const config = {
    configurable: {
        thread_id: threadId
    }
};
console.log("before graph in approved");
const result = await graph.invoke(
    new Command({
        resume: {
            approved
        }
    }),
    config
);

console.log("after graph in approved thing ");
console.log(result);

    /*
     * Rejected: the graph went back to storyboardWriter and has produced a
     * fresh storyboard, which it is now waiting for approval on again. There
     * is no render in this branch, so do not wait for a video.
     */
    if (!approved) {
        return res.json({
            storyBoard: result.storyBoard,
        });
    }

    /*
     * The graph has offloaded the render to the worker and paused at
     * waitForRenderResult, so keep the response open until the worker has
     * written the video, then send the file itself.
     */
    const videoPath = await awaitRenderedVideo(userId);

    return res.sendFile(
        videoPath,
        (err) => {
            if (err && !res.headersSent) {
                console.log("Failed to send the video:", err);
                res.status(500).json({
                    message: "The video could not be sent."
                });
            }
        }
    );


    }catch(err:any){
        console.log(err);
        res.status(500).json({
        "message": err?.message || " there is a  error"
    })

    }



})


export default router ;