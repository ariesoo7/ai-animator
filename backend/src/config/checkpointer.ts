import "dotenv/config";

import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(mongoUri);

await client.connect();

export const checkpointer = new MongoDBSaver({
  client,
  dbName: process.env.MONGODB_DB ?? "manim_generator",
});

await checkpointer.setup();