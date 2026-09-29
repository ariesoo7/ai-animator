import {HumanMessage} from "@langchain/core/messages";
import { localLlm } from "../config/model";


async function testOllamaConnection() {
    console.log("Testing local Ollama connection...");
    
    try {
        // We use LangChain's standard message format
        const messages = [
            new HumanMessage("Write a single line of Python code that prints 'Hello Manim'.")
        ];

        // Invoke the model
        const response = await localLlm.invoke(messages);
        
        // The actual text content is inside response.content
        console.log("Success! Ollama replied:");
        console.log(response.content);
        
    } catch (error) {
        console.error("Failed to connect to Ollama. Is the server running?", error);
    }
}

// Run the test
testOllamaConnection();
