import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TaskEdit from "./TaskEdit";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  fetchTask: vi.fn(),
  updateTask: vi.fn(),
  STATUS_LABELS: {},
  STATUS_COLORS: {},
}));

const mockFetchTask = vi.mocked(api.fetchTask);
const mockUpdateTask = vi.mocked(api.updateTask);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderComponent(taskId = "1") {
  return render(
    <MemoryRouter initialEntries={[`/tasks/${taskId}/edit`]}>
      <Routes>
        <Route path="/tasks/:id/edit" element={<TaskEdit />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TaskEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスク編集フォームが表示される", async () => {
    mockFetchTask.mockResolvedValue({
      id: 1,
      title: "テストタスク",
      description: "テスト説明",
      status: "todo",
      due_date: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("タスク編集")).toBeInTheDocument();
      expect(screen.getByDisplayValue("テストタスク")).toBeInTheDocument();
      expect(screen.getByDisplayValue("テスト説明")).toBeInTheDocument();
    });
  });

  it("更新ボタンでタスクを更新できる", async () => {
    mockFetchTask.mockResolvedValue({
      id: 1,
      title: "テスト",
      description: "",
      status: "todo",
      due_date: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });
    mockUpdateTask.mockResolvedValue({
      id: 1,
      title: "更新タスク",
      description: null,
      status: "todo",
      due_date: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("テスト")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("テスト"), {
      target: { value: "更新タスク" },
    });
    fireEvent.click(screen.getByText("更新"));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(1, {
        title: "更新タスク",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/tasks/1");
    });
  });

  it("キャンセルボタンで詳細画面に戻る", async () => {
    mockFetchTask.mockResolvedValue({
      id: 1,
      title: "テスト",
      description: "",
      status: "todo",
      due_date: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("キャンセル")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("キャンセル"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks/1");
  });
});
