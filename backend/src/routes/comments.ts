import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import Database from "better-sqlite3";
import { handleValidationErrors } from "../helpers/validation.js";

export function createCommentRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/tasks/:id/comments - コメント一覧取得
  router.get(
    "/:id/comments",
    param("id").isInt({ min: 1 }).withMessage("タスクIDは正の整数で指定してください"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      if (!task) {
        res.status(404).json({ error: "タスクが見つかりません" });
        return;
      }

      const comments = db
        .prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC")
        .all(req.params.id);
      res.json({ comments });
    }
  );

  // POST /api/tasks/:id/comments - コメント投稿
  router.post(
    "/:id/comments",
    param("id").isInt({ min: 1 }).withMessage("タスクIDは正の整数で指定してください"),
    body("body").notEmpty().withMessage("コメント本文は必須です"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      if (!task) {
        res.status(404).json({ error: "タスクが見つかりません" });
        return;
      }

      const { body: commentBody } = req.body;
      const result = db
        .prepare("INSERT INTO comments (task_id, body) VALUES (?, ?)")
        .run(req.params.id, commentBody);

      const comment = db
        .prepare("SELECT * FROM comments WHERE id = ?")
        .get(result.lastInsertRowid);
      res.status(201).json(comment);
    }
  );

  // PUT /api/tasks/:id/comments/:commentId - コメント編集
  router.put(
    "/:id/comments/:commentId",
    param("id").isInt({ min: 1 }).withMessage("タスクIDは正の整数で指定してください"),
    param("commentId").isInt({ min: 1 }).withMessage("コメントIDは正の整数で指定してください"),
    body("body").notEmpty().withMessage("コメント本文は必須です"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const comment = db
        .prepare("SELECT * FROM comments WHERE id = ? AND task_id = ?")
        .get(req.params.commentId, req.params.id);
      if (!comment) {
        res.status(404).json({ error: "コメントが見つかりません" });
        return;
      }

      const { body: commentBody } = req.body;
      db.prepare(
        "UPDATE comments SET body = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(commentBody, req.params.commentId);

      const updated = db
        .prepare("SELECT * FROM comments WHERE id = ?")
        .get(req.params.commentId);
      res.json(updated);
    }
  );

  // DELETE /api/tasks/:id/comments/:commentId - コメント削除
  router.delete(
    "/:id/comments/:commentId",
    param("id").isInt({ min: 1 }).withMessage("タスクIDは正の整数で指定してください"),
    param("commentId").isInt({ min: 1 }).withMessage("コメントIDは正の整数で指定してください"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const comment = db
        .prepare("SELECT * FROM comments WHERE id = ? AND task_id = ?")
        .get(req.params.commentId, req.params.id);
      if (!comment) {
        res.status(404).json({ error: "コメントが見つかりません" });
        return;
      }

      db.prepare("DELETE FROM comments WHERE id = ?").run(req.params.commentId);
      res.status(204).send();
    }
  );

  return router;
}
