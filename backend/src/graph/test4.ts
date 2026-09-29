
import { localLlm } from "../config/model.js";
import graph from "./graph.js";
import { Command } from "@langchain/langgraph";



    const config = {
        configurable:{
            thread_id : "23456789"
        }
    };

        const result = await graph.invoke({
            userId : "12345678",
            topic:"explain binary search using an array",
            approved: true 
        }, {
            ...config,
        });


      const resumeResult = await graph.invoke(
      new Command({
        resume: {
          approved: true,
          hasError: true 
        },
      }),
      config
    );


console.log("LLM RESPONSE:", result);