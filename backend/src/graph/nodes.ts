import manimState from "./state.js";
import { localLlm } from "../config/model.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Command, getConfig, interrupt } from "@langchain/langgraph";
import {testpipeline} from "../workers/render.worker.js";
import { MANIM_CODER_SYSTEM_PROMPT, STORYBOARD_WRITER_SYSTEM_PROMPT,MANIM_ERROR_SOLVER_SYSTEM_PROMPT } from "./prompts.js";


function cleanPython(text: string ){
    return text.replace(/```python/g,"")
    .replace(/```/g,"")
    .trim()
}


 export const storyboardWriter = async (
    state:typeof manimState.State
)=>{
    console.log("generating the storyboard!!")
const response = await localLlm.invoke([
  new SystemMessage(STORYBOARD_WRITER_SYSTEM_PROMPT),

  new HumanMessage(state.topic),
]);

const storyBoard = response.content.toString();

console.log("inside the storyboard node");

return {
  storyBoard,
  status: "storyboard_generated",
};
}

export const askForApproval = async (
    state : typeof manimState.State
)=>{

    console.log("inside the approval node ");

    const response = interrupt({
        type: "storyboard_approval",
        storyboard: state.storyBoard
    });

    if (response.approved) {
        return new Command({
            goto: "coder",
            update: {
                approved: true
            }
        });
    }

    return new Command({
        goto: "storyboardWriter",
        update: {
            approved: false
        }
    });
}
// the coder of the storyboard from the scene 

export const coder = async(
    state : typeof manimState.State
)=>{

    const response = await localLlm.invoke([
        new SystemMessage(MANIM_CODER_SYSTEM_PROMPT),
        new HumanMessage(state.storyBoard)
    ]);

   return {
    code : cleanPython(String(response.content)),
    status:"",
   }

};

// this offloads the work to the queue 

export const offload = async (
    state: typeof manimState.State
) => {
   console.log("inside the offloading node ");

   const code = state.code.toString();

  console.log(code);
   // The worker must resume this exact thread, not guess it from the user.
   const threadId = getConfig()?.configurable?.thread_id;

   testpipeline(code, state.userId, threadId)
    .catch(console.error);

    return {
        status: "rendering",
    }; 
};

// solves the error  in the code (if any )
export const error_solver = async (
    state: typeof manimState.State
)=>{
    console.log("inside the error solver node");

  

    const response = await localLlm.invoke([
        new SystemMessage(MANIM_ERROR_SOLVER_SYSTEM_PROMPT),
        new HumanMessage(`The error is ${state.error} and the code is ${state.code}`)
    ]);

   return {
    code : cleanPython(String(response.content)),
    status:"",
   }
}


export const waitForRenderResult = async (
    state: typeof manimState.State
) => {
    console.log("inside waitForRenderResult node (paused, waiting on worker)");

    const result = interrupt({
        type: "render_result_pending",
    });

    // result is whatever the worker passes via Command({ resume: ... })
    const hasError = !!result.hasError;

    return {
        hasError,
        error: result.error || "",
        videoPath: result.videoPath || state.videoPath,
        retryCount: hasError ? (state.retryCount || 0) + 1 : 0,
        status: hasError ? "render_failed" : "render_complete",
    };
};