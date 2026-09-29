import express, { Express } from 'express';
import authRoutes from './routes/authentication.routes.js';
import chatRoutes from './routes/chat.routes.js';
import cookieParser from "cookie-parser";

import cors from "cors";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Must be registered before the body parser so preflight (OPTIONS) requests
// are answered by cors() immediately and always carry the credentials headers.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Parse incoming JSON payloads so we can access req.body in controllers
app.use(express.json());
app.use(cookieParser());

// Mount the user resource routes
app.use('/users',authRoutes);
app.use('/generate',chatRoutes);

// Unmatched routes must return JSON, not an HTML error page
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
 
