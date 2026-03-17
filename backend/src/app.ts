import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { getDatabase } from "./database.js";
import { createTaskRouter } from "./routes/tasks.js";
import { createCommentRouter } from "./routes/comments.js";
import { createProjectRouter } from "./routes/projects.js";

export function createApp(db?: Database.Database) {
  const app = express();
  const database = db ?? getDatabase();

  app.use(cors());
  app.use(express.json());

  app.use("/api/projects", createProjectRouter(database));
  app.use("/api/tasks", createTaskRouter(database));
  app.use("/api/tasks", createCommentRouter(database));

  return app;
}
