import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TaskCreate from "./TaskCreate";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  createTask: vi.fn(),
  STATUS_LABELS: {},
  STATUS_COLORS: {},
}));

const mockCreateTask = vi.mocked(api.createTask);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderComponent() {
  return render(
    <MemoryRouter>
      <TaskCreate />
    </MemoryRouter>
  );
}

describe("TaskCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスク作成フォームが表示される", () => {
    renderComponent();
    expect(screen.getByText("タスク作成")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("タスクのタイトルを入力")).toBeInTheDocument();
    expect(screen.getByText("作成")).toBeInTheDocument();
  });

  it("タイトル未入力で送信するとバリデーションエラーが表示される", async () => {
    renderComponent();
    fireEvent.click(screen.getByText("作成"));
    await waitFor(() => {
      expect(screen.getByText("タイトルは必須です")).toBeInTheDocument();
    });
  });

  it("正しい入力でタスクを作成できる", async () => {
    mockCreateTask.mockResolvedValue({
      id: 1,
      title: "テスト",
      description: null,
      status: "todo",
      due_date: null,
      project_id: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });

    renderComponent();
    fireEvent.change(screen.getByPlaceholderText("タスクのタイトルを入力"), {
      target: { value: "テスト" },
    });
    fireEvent.click(screen.getByText("作成"));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: "テスト",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/tasks");
    });
  });

  it("キャンセルボタンでタスク一覧に戻る", () => {
    renderComponent();
    fireEvent.click(screen.getByText("キャンセル"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks");
  });
});
