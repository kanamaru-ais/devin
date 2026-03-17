import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { createTestDatabase } from "../database.js";
import Database from "better-sqlite3";

let db: Database.Database;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = createTestDatabase();
  app = createApp(db);
});

describe("GET /api/projects", () => {
  it("空の状態でプロジェクト一覧を取得できる", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.projects).toEqual([]);
  });

  it("プロジェクトが存在する場合一覧を取得できる", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("テストプロジェクト");
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(1);
    expect(res.body.projects[0].name).toBe("テストプロジェクト");
  });

  it("作成日時の降順で取得できる", async () => {
    db.prepare("INSERT INTO projects (name, created_at) VALUES (?, ?)").run(
      "古いプロジェクト",
      "2020-01-01 00:00:00"
    );
    db.prepare("INSERT INTO projects (name, created_at) VALUES (?, ?)").run(
      "新しいプロジェクト",
      "2025-01-01 00:00:00"
    );
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.projects[0].name).toBe("新しいプロジェクト");
    expect(res.body.projects[1].name).toBe("古いプロジェクト");
  });
});

describe("GET /api/projects/:id", () => {
  it("プロジェクト詳細を取得できる", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("テストプロジェクト");
    const res = await request(app).get("/api/projects/1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("テストプロジェクト");
  });

  it("存在しないプロジェクトは404を返す", async () => {
    const res = await request(app).get("/api/projects/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("プロジェクトが見つかりません");
  });

  it("不正なIDはエラーを返す", async () => {
    const res = await request(app).get("/api/projects/abc");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/projects", () => {
  it("プロジェクトを作成できる", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "新しいプロジェクト" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("新しいプロジェクト");
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
    expect(res.body.updated_at).toBeDefined();
  });

  it("名前なしではエラーになる", async () => {
    const res = await request(app).post("/api/projects").send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("名前が空文字ではエラーになる", async () => {
    const res = await request(app).post("/api/projects").send({ name: "" });
    expect(res.status).toBe(400);
  });

  it("名前が255文字を超えるとエラーになる", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "a".repeat(256) });
    expect(res.status).toBe(400);
  });

  it("名前が255文字以内なら作成できる", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "a".repeat(255) });
    expect(res.status).toBe(201);
  });
});

describe("PUT /api/projects/:id", () => {
  it("プロジェクト名を更新できる", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("元の名前");
    const res = await request(app)
      .put("/api/projects/1")
      .send({ name: "新しい名前" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("新しい名前");
  });

  it("存在しないプロジェクトの更新は404を返す", async () => {
    const res = await request(app)
      .put("/api/projects/999")
      .send({ name: "名前" });
    expect(res.status).toBe(404);
  });

  it("名前なしではエラーになる", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("プロジェクト");
    const res = await request(app).put("/api/projects/1").send({});
    expect(res.status).toBe(400);
  });

  it("updated_atが更新される", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("プロジェクト");
    const before = db.prepare("SELECT * FROM projects WHERE id = 1").get() as any;
    await request(app).put("/api/projects/1").send({ name: "更新後" });
    const after = db.prepare("SELECT * FROM projects WHERE id = 1").get() as any;
    expect(after.name).toBe("更新後");
  });
});

describe("DELETE /api/projects/:id", () => {
  it("プロジェクトを削除できる", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("削除対象");
    const res = await request(app).delete("/api/projects/1");
    expect(res.status).toBe(204);

    const check = await request(app).get("/api/projects/1");
    expect(check.status).toBe(404);
  });

  it("存在しないプロジェクトの削除は404を返す", async () => {
    const res = await request(app).delete("/api/projects/999");
    expect(res.status).toBe(404);
  });

  it("プロジェクト削除時に紐づくタスクも削除される", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("プロジェクト");
    db.prepare(
      "INSERT INTO tasks (title, status, project_id) VALUES (?, ?, ?)"
    ).run("タスク1", "todo", 1);
    db.prepare(
      "INSERT INTO tasks (title, status, project_id) VALUES (?, ?, ?)"
    ).run("タスク2", "todo", 1);

    await request(app).delete("/api/projects/1");

    const tasks = db.prepare("SELECT * FROM tasks WHERE project_id = 1").all();
    expect(tasks).toHaveLength(0);
  });

  it("プロジェクト削除時に紐づくタスクのコメントも削除される", async () => {
    db.prepare("INSERT INTO projects (name) VALUES (?)").run("プロジェクト");
    db.prepare(
      "INSERT INTO tasks (title, status, project_id) VALUES (?, ?, ?)"
    ).run("タスク", "todo", 1);
    db.prepare("INSERT INTO comments (task_id, body) VALUES (?, ?)").run(
      1,
      "コメント"
    );

    await request(app).delete("/api/projects/1");

    const comments = db.prepare("SELECT * FROM comments").all();
    expect(comments).toHaveLength(0);
  });
});
