import { Router, Request, Response } from "express";
import { body, query, param, validationResult } from "express-validator";
import Database from "better-sqlite3";

export function createTaskRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/tasks - タスク一覧取得
  router.get(
    "/",
    query("status")
      .optional()
      .isIn(["todo", "in_progress", "done"])
      .withMessage("ステータスは todo, in_progress, done のいずれかを指定してください"),
    query("project_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("プロジェクトIDは正の整数で指定してください"),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array().map((e) => ({ field: e.type === "field" ? (e as any).path : "", message: e.msg })) });
        return;
      }

      const status = req.query.status as string | undefined;
      const projectId = req.query.project_id as string | undefined;
      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (status) {
        conditions.push("status = ?");
        params.push(status);
      }
      if (projectId) {
        conditions.push("project_id = ?");
        params.push(Number(projectId));
      }

      const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
      const tasks = db.prepare(`SELECT * FROM tasks${where} ORDER BY created_at DESC`).all(...params);
      res.json({ tasks });
    }
  );

  // POST /api/tasks - タスク作成
  router.post(
    "/",
    body("title")
      .notEmpty()
      .withMessage("タイトルは必須です")
      .isLength({ max: 255 })
      .withMessage("タイトルは255文字以内で入力してください"),
    body("description").optional({ values: "null" }),
    body("due_date")
      .optional({ values: "null" })
      .isISO8601({ strict: true, strictSeparator: false })
      .withMessage("期限は有効な日付形式（YYYY-MM-DD）で入力してください")
      .custom((value: string) => {
        if (value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(value + "T00:00:00");
          if (dueDate < today) {
            throw new Error("期限に過去の日付は指定できません");
          }
        }
        return true;
      }),
    body("project_id")
      .optional({ values: "null" })
      .isInt({ min: 1 })
      .withMessage("プロジェクトIDは正の整数で指定してください"),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          errors: errors.array().map((e) => ({
            field: e.type === "field" ? (e as any).path : "",
            message: e.msg,
          })),
        });
        return;
      }

      const { title, description, due_date, project_id } = req.body;

      if (project_id) {
        const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(project_id);
        if (!project) {
          res.status(404).json({ error: "プロジェクトが見つかりません" });
          return;
        }
      }

      const stmt = db.prepare(
        "INSERT INTO tasks (title, description, due_date, project_id) VALUES (?, ?, ?, ?)"
      );
      const result = stmt.run(title, description || null, due_date || null, project_id || null);
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
      res.status(201).json(task);
    }
  );

  // GET /api/tasks/:id - タスク詳細取得
  router.get(
    "/:id",
    param("id").isInt({ min: 1 }).withMessage("タスクIDは正の整数で指定してください"),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          errors: errors.array().map((e) => ({
            field: e.type === "field" ? (e as any).path : "",
            message: e.msg,
          })),
        });
        return;
      }

      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      if (!task) {
        res.status(404).json({ error: "タスクが見つかりません" });
        return;
      }
      res.json(task);
    }
  );

  // PUT /api/tasks/:id - タスク更新
  router.put(
    "/:id",
    param("id").isInt({ min: 1 }).withMessage("タスクIDは正の整数で指定してください"),
    body("title")
      .notEmpty()
      .withMessage("タイトルは必須です")
      .isLength({ max: 255 })
      .withMessage("タイトルは255文字以内で入力してください"),
    body("description").optional({ values: "null" }),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          errors: errors.array().map((e) => ({
            field: e.type === "field" ? (e as any).path : "",
            message: e.msg,
          })),
        });
        return;
      }

      const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "タスクが見つかりません" });
        return;
      }

      const { title, description } = req.body;
      db.prepare(
        "UPDATE tasks SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(title, description ?? null, req.params.id);

      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      res.json(task);
    }
  );

  // PATCH /api/tasks/:id/status - タスクステータス変更
  router.patch(
    "/:id/status",
    param("id").isInt({ min: 1 }).withMessage("タスクIDは正の整数で指定してください"),
    body("status")
      .notEmpty()
      .withMessage("ステータスは必須です")
      .isIn(["todo", "in_progress", "done"])
      .withMessage("ステータスは todo, in_progress, done のいずれかを指定してください"),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          errors: errors.array().map((e) => ({
            field: e.type === "field" ? (e as any).path : "",
            message: e.msg,
          })),
        });
        return;
      }

      const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "タスクが見つかりません" });
        return;
      }

      const { status } = req.body;
      db.prepare(
        "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(status, req.params.id);

      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      res.json(task);
    }
  );

  return router;
}
