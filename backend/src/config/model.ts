import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const localLlm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
});