import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TaskList from "./TaskList";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  fetchTasks: vi.fn(),
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

const mockFetchTasks = vi.mocked(api.fetchTasks);

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <TaskList />
    </MemoryRouter>
  );
}

describe("TaskList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスク一覧のタイトルが表示される", async () => {
    mockFetchTasks.mockResolvedValue({ tasks: [] });
    renderWithRouter();
    expect(screen.getByText("タスク一覧")).toBeInTheDocument();
  });

  it("タスクがない場合にメッセージが表示される", async () => {
    mockFetchTasks.mockResolvedValue({ tasks: [] });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    });
  });

  it("タスク一覧が表示される", async () => {
    mockFetchTasks.mockResolvedValue({
      tasks: [
        {
          id: 1,
          title: "テストタスク",
          description: null,
          status: "todo" as const,
          due_date: "2027-01-01",
          project_id: null,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
      // "起票" appears in both the filter dropdown and the status badge
      expect(screen.getAllByText("起票").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("新規作成ボタンが表示される", async () => {
    mockFetchTasks.mockResolvedValue({ tasks: [] });
    renderWithRouter();
    expect(screen.getByText("新規作成")).toBeInTheDocument();
  });

  it("エラー時にメッセージが表示される", async () => {
    mockFetchTasks.mockRejectedValue(new Error("Network error"));
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("タスクの取得に失敗しました")).toBeInTheDocument();
    });
  });
});
