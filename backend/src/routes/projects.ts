import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import Database from "better-sqlite3";
import { handleValidationErrors } from "../helpers/validation.js";

export function createProjectRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/projects - プロジェクト一覧取得
  router.get("/", (req: Request, res: Response) => {
    const projects = db
      .prepare("SELECT * FROM projects ORDER BY created_at DESC")
      .all();
    res.json({ projects });
  });

  // GET /api/projects/:id - プロジェクト詳細取得
  router.get(
    "/:id",
    param("id")
      .isInt({ min: 1 })
      .withMessage("プロジェクトIDは正の整数で指定してください"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(req.params.id);
      if (!project) {
        res.status(404).json({ error: "プロジェクトが見つかりません" });
        return;
      }
      res.json(project);
    }
  );

  // POST /api/projects - プロジェクト作成
  router.post(
    "/",
    body("name")
      .notEmpty()
      .withMessage("プロジェクト名は必須です")
      .isLength({ max: 255 })
      .withMessage("プロジェクト名は255文字以内で入力してください"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const { name } = req.body;
      const stmt = db.prepare("INSERT INTO projects (name) VALUES (?)");
      const result = stmt.run(name);
      const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(result.lastInsertRowid);
      res.status(201).json(project);
    }
  );

  // PUT /api/projects/:id - プロジェクト名更新
  router.put(
    "/:id",
    param("id")
      .isInt({ min: 1 })
      .withMessage("プロジェクトIDは正の整数で指定してください"),
    body("name")
      .notEmpty()
      .withMessage("プロジェクト名は必須です")
      .isLength({ max: 255 })
      .withMessage("プロジェクト名は255文字以内で入力してください"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const existing = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "プロジェクトが見つかりません" });
        return;
      }

      const { name } = req.body;
      db.prepare(
        "UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(name, req.params.id);

      const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(req.params.id);
      res.json(project);
    }
  );

  // DELETE /api/projects/:id - プロジェクト削除
  router.delete(
    "/:id",
    param("id")
      .isInt({ min: 1 })
      .withMessage("プロジェクトIDは正の整数で指定してください"),
    (req: Request, res: Response) => {
      if (handleValidationErrors(req, res)) return;

      const existing = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "プロジェクトが見つかりません" });
        return;
      }

      db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
      res.status(204).send();
    }
  );

  return router;
}
