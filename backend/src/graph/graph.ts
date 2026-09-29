import {
  StateGraph,
  START,
  END,
  NodeError,
}from "@langchain/langgraph";

import manimState from "./state.js";
import { checkpointer } from "../config/checkpointer.js";

import {
storyboardWriter,
coder,
askForApproval ,
offload  ,
waitForRenderResult  
} from "./nodes.js";
import { error_solver } from "./nodes.js";


const MAX_RETRIES = 3;

const graph = new StateGraph(manimState)
  .addNode("storyboardWriter", storyboardWriter)
  .addNode("coder", coder)
  .addNode("askForApproval", askForApproval)
  .addNode("offload", offload)
  .addNode("waitForRenderResult", waitForRenderResult)
  .addNode("solveError", error_solver)

  .addEdge(START, "storyboardWriter")
  .addEdge("storyboardWriter", "askForApproval")
  .addEdge("askForApproval", "coder")
  .addEdge("coder", "offload")
  .addEdge("offload", "waitForRenderResult")

  .addConditionalEdges(
    "waitForRenderResult",
    (state) => {
      if (state.hasError && (state.retryCount || 0) <= MAX_RETRIES) {
        return "retry";
      }
      if (state.hasError) {
        return "giveUp";
      }
      return "success";
    },
    {
      retry: "solveError",
      giveUp: END,
      success: END,
    }
  )

  .addEdge("solveError", "offload") // fixed code goes straight back to render, not through coder

  .compile({ checkpointer });

export default graph;