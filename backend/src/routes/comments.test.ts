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
  // テスト用タスクを作成
  db.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run("テストタスク", "todo");
});

describe("GET /api/tasks/:id/comments", () => {
  it("空のコメント一覧を取得できる", async () => {
    const res = await request(app).get("/api/tasks/1/comments");
    expect(res.status).toBe(200);
    expect(res.body.comments).toEqual([]);
  });

  it("コメントが存在する場合一覧を取得できる", async () => {
    db.prepare("INSERT INTO comments (task_id, body) VALUES (?, ?)").run(1, "テストコメント");
    const res = await request(app).get("/api/tasks/1/comments");
    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].body).toBe("テストコメント");
  });

  it("存在しないタスクのコメント取得は404を返す", async () => {
    const res = await request(app).get("/api/tasks/999/comments");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/tasks/:id/comments", () => {
  it("コメントを投稿できる", async () => {
    const res = await request(app)
      .post("/api/tasks/1/comments")
      .send({ body: "新しいコメント" });
    expect(res.status).toBe(201);
    expect(res.body.body).toBe("新しいコメント");
    expect(res.body.task_id).toBe(1);
  });

  it("空のコメントはエラーになる", async () => {
    const res = await request(app)
      .post("/api/tasks/1/comments")
      .send({ body: "" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("body");
  });

  it("body なしではエラーになる", async () => {
    const res = await request(app).post("/api/tasks/1/comments").send({});
    expect(res.status).toBe(400);
  });

  it("存在しないタスクへのコメント投稿は404を返す", async () => {
    const res = await request(app)
      .post("/api/tasks/999/comments")
      .send({ body: "コメント" });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/tasks/:id/comments/:commentId", () => {
  beforeEach(() => {
    db.prepare("INSERT INTO comments (task_id, body) VALUES (?, ?)").run(1, "元のコメント");
  });

  it("コメントを編集できる", async () => {
    const res = await request(app)
      .put("/api/tasks/1/comments/1")
      .send({ body: "編集後のコメント" });
    expect(res.status).toBe(200);
    expect(res.body.body).toBe("編集後のコメント");
  });

  it("空のコメントに編集するとエラーになる", async () => {
    const res = await request(app)
      .put("/api/tasks/1/comments/1")
      .send({ body: "" });
    expect(res.status).toBe(400);
  });

  it("存在しないコメントの編集は404を返す", async () => {
    const res = await request(app)
      .put("/api/tasks/1/comments/999")
      .send({ body: "コメント" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id/comments/:commentId", () => {
  beforeEach(() => {
    db.prepare("INSERT INTO comments (task_id, body) VALUES (?, ?)").run(1, "削除対象コメント");
  });

  it("コメントを削除できる", async () => {
    const res = await request(app).delete("/api/tasks/1/comments/1");
    expect(res.status).toBe(204);

    // 削除後に取得すると空になる
    const getRes = await request(app).get("/api/tasks/1/comments");
    expect(getRes.body.comments).toHaveLength(0);
  });

  it("存在しないコメントの削除は404を返す", async () => {
    const res = await request(app).delete("/api/tasks/1/comments/999");
    expect(res.status).toBe(404);
  });
});
