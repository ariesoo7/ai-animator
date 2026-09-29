import "dotenv/config";

import { randomUUID } from "node:crypto";
import { Command } from "@langchain/langgraph";

import graph from "../graph/graph.js";

async function main() {
  // --------------------------------------------------
  // 1. Create a unique thread ID
  // --------------------------------------------------


  

  const threadId = "123456789";

  console.log("\n=================================");
  console.log("Starting Manim Graph");
  console.log("=================================");
  console.log("Thread ID:", threadId);


  // --------------------------------------------------
  // 2. LangGraph configuration
  // --------------------------------------------------

  const config = {
    configurable: {
      thread_id: threadId,
    },
  };


  // --------------------------------------------------
  // 3. Start the graph
  // --------------------------------------------------

  console.log("\nStarting graph...\n");

const result = await graph.invoke(
  {
    topic: `
    binary search
    `,
  },
  config
);

  // --------------------------------------------------
  // 4. Check whether the graph interrupted
  // --------------------------------------------------

  if (result.__interrupt__) {
    console.log("\n=================================");
    console.log("GRAPH INTERRUPTED");
    console.log("=================================\n");

    console.dir(result.__interrupt__, {
      depth: null,
    });


    // --------------------------------------------------
    // 5. Simulate user approval
    // --------------------------------------------------

    console.log("\nSimulating user approval...\n");


    const resumeResult = await graph.invoke(
      new Command({
        resume: {
          approved: true,
        },
      }),
      config
    );


    // --------------------------------------------------
    // 6. Graph should continue after interrupt
    // --------------------------------------------------

    console.log("\n=================================");
    console.log("GRAPH FINISHED");
    console.log("=================================\n");
   

    console.log(resumeResult);
  } else {
    console.log("\nGraph completed without interruption.");

    console.dir(result, {
      depth: null,
    });
  }
}

main().catch((error) => {
  console.error("\nGraph failed:");
  console.error(error);

  process.exit(1);
});