import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TaskDetail from "./TaskDetail";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  fetchTask: vi.fn(),
  fetchComments: vi.fn(),
  updateTaskStatus: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  STATUS_LABELS: {
    todo: "起票",
    in_progress: "進行中",
    done: "完了",
  },
  STATUS_COLORS: {
    todo: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    done: "bg-green-100 text-green-800",
  },
}));

const mockFetchTask = vi.mocked(api.fetchTask);
const mockFetchComments = vi.mocked(api.fetchComments);

function renderComponent(taskId = "1") {
  return render(
    <MemoryRouter initialEntries={[`/tasks/${taskId}`]}>
      <Routes>
        <Route path="/tasks/:id" element={<TaskDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TaskDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスク詳細が表示される", async () => {
    mockFetchTask.mockResolvedValue({
      id: 1,
      title: "テストタスク",
      description: "テスト説明",
      status: "todo",
      due_date: "2027-01-01",
      created_at: "2026-01-01T00:00:00",
      updated_at: "2026-01-01T00:00:00",
    });
    mockFetchComments.mockResolvedValue({ comments: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
      expect(screen.getByText("テスト説明")).toBeInTheDocument();
    });
  });

  it("読み込み中表示が出る", () => {
    mockFetchTask.mockImplementation(() => new Promise(() => {}));
    mockFetchComments.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("コメント一覧が表示される", async () => {
    mockFetchTask.mockResolvedValue({
      id: 1,
      title: "テスト",
      description: null,
      status: "todo",
      due_date: null,
      created_at: "2026-01-01T00:00:00",
      updated_at: "2026-01-01T00:00:00",
    });
    mockFetchComments.mockResolvedValue({
      comments: [
        {
          id: 1,
          task_id: 1,
          body: "テストコメント",
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("テストコメント")).toBeInTheDocument();
    });
  });

  it("エラー時にメッセージが表示される", async () => {
    mockFetchTask.mockRejectedValue(new Error("Not found"));
    mockFetchComments.mockRejectedValue(new Error("Not found"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
    });
  });
});
