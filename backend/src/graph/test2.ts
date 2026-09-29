import "dotenv/config";

import graph from "../graph/graph.js";
import { randomUUID } from "node:crypto";

const threadId = randomUUID();

const config = {
  configurable: {
    thread_id: threadId,
  },
};

const result = await graph.invoke(
  {
    topic: "Reflection of Light",
  },
  config
);

console.log("Thread ID:", threadId);
console.dir(result, { depth: null });