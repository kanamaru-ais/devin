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

describe("GET /api/tasks", () => {
  it("空の状態でタスク一覧を取得できる", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
  });

  it("タスクが存在する場合一覧を取得できる", async () => {
    db.prepare("INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)").run(
      "テストタスク",
      "説明文",
      "todo"
    );
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe("テストタスク");
  });

  it("ステータスでフィルタリングできる", async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("タスク1", "todo");
    db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("タスク2", "in_progress");
    db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("タスク3", "done");

    const res = await request(app).get("/api/tasks?status=todo");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe("タスク1");
  });

  it("不正なステータスでフィルタするとエラーになる", async () => {
    const res = await request(app).get("/api/tasks?status=invalid");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/tasks", () => {
  it("タスクを作成できる", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "新しいタスク", description: "説明", due_date: "2027-12-31" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("新しいタスク");
    expect(res.body.status).toBe("todo");
    expect(res.body.description).toBe("説明");
    expect(res.body.due_date).toBe("2027-12-31");
  });

  it("タイトルなしではエラーになる", async () => {
    const res = await request(app).post("/api/tasks").send({ description: "説明のみ" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].field).toBe("title");
  });

  it("タイトルが空文字ではエラーになる", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("説明と期限なしでもタスクを作成できる", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "最小タスク" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("最小タスク");
    expect(res.body.description).toBeNull();
    expect(res.body.due_date).toBeNull();
  });
});

describe("GET /api/tasks/:id", () => {
  it("タスク詳細を取得できる", async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("テストタスク", "todo");
    const res = await request(app).get("/api/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("テストタスク");
  });

  it("存在しないタスクは404を返す", async () => {
    const res = await request(app).get("/api/tasks/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("タスクが見つかりません");
  });
});

describe("PUT /api/tasks/:id", () => {
  it("タスクを更新できる", async () => {
    db.prepare("INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)").run(
      "元タイトル",
      "元説明",
      "todo"
    );
    const res = await request(app)
      .put("/api/tasks/1")
      .send({ title: "新タイトル", description: "新説明" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("新タイトル");
    expect(res.body.description).toBe("新説明");
  });

  it("存在しないタスクの更新は404を返す", async () => {
    const res = await request(app)
      .put("/api/tasks/999")
      .send({ title: "タイトル" });
    expect(res.status).toBe(404);
  });

  it("タイトルなしではエラーになる", async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("タスク", "todo");
    const res = await request(app).put("/api/tasks/1").send({ description: "説明のみ" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/tasks/:id/status", () => {
  it("ステータスを変更できる", async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("タスク", "todo");
    const res = await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "in_progress" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in_progress");
  });

  it("不正なステータスはエラーになる", async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("タスク", "todo");
    const res = await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "invalid" });
    expect(res.status).toBe(400);
  });

  it("存在しないタスクのステータス変更は404を返す", async () => {
    const res = await request(app)
      .patch("/api/tasks/999/status")
      .send({ status: "done" });
    expect(res.status).toBe(404);
  });
});
