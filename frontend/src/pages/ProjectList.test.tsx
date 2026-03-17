import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProjectList from "./ProjectList";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

const mockFetchProjects = vi.mocked(api.fetchProjects);
const mockCreateProject = vi.mocked(api.createProject);
const mockUpdateProject = vi.mocked(api.updateProject);
const mockDeleteProject = vi.mocked(api.deleteProject);

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ProjectList />
    </MemoryRouter>
  );
}

describe("ProjectList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("プロジェクト一覧のタイトルが表示される", async () => {
    mockFetchProjects.mockResolvedValue({ projects: [] });
    renderWithRouter();
    expect(screen.getByText("プロジェクト一覧")).toBeInTheDocument();
  });

  it("プロジェクトがない場合にメッセージが表示される", async () => {
    mockFetchProjects.mockResolvedValue({ projects: [] });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("プロジェクトがありません")).toBeInTheDocument();
    });
  });

  it("プロジェクト一覧が表示される", async () => {
    mockFetchProjects.mockResolvedValue({
      projects: [
        {
          id: 1,
          name: "テストプロジェクト",
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
    });
  });

  it("新規作成ボタンが表示される", async () => {
    mockFetchProjects.mockResolvedValue({ projects: [] });
    renderWithRouter();
    expect(screen.getByText("新規作成")).toBeInTheDocument();
  });

  it("エラー時にメッセージが表示される", async () => {
    mockFetchProjects.mockRejectedValue(new Error("Network error"));
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("プロジェクトの取得に失敗しました")).toBeInTheDocument();
    });
  });

  it("新規作成ダイアログが開閉できる", async () => {
    mockFetchProjects.mockResolvedValue({ projects: [] });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("プロジェクトがありません")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("新規作成"));
    expect(screen.getByText("プロジェクト作成")).toBeInTheDocument();

    fireEvent.click(screen.getByText("キャンセル"));
    await waitFor(() => {
      expect(screen.queryByText("プロジェクト作成")).not.toBeInTheDocument();
    });
  });

  it("プロジェクトを作成できる", async () => {
    mockFetchProjects.mockResolvedValue({ projects: [] });
    mockCreateProject.mockResolvedValue({
      id: 1,
      name: "新プロジェクト",
      created_at: "2026-01-01T00:00:00",
      updated_at: "2026-01-01T00:00:00",
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("プロジェクトがありません")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("新規作成"));
    const input = screen.getByPlaceholderText("プロジェクト名を入力");
    fireEvent.change(input, { target: { value: "新プロジェクト" } });
    fireEvent.click(screen.getByText("作成"));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith("新プロジェクト");
    });
  });

  it("編集ダイアログが開閉できる", async () => {
    mockFetchProjects.mockResolvedValue({
      projects: [
        {
          id: 1,
          name: "テストプロジェクト",
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("テストプロジェクト")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("編集"));
    expect(screen.getByText("プロジェクト編集")).toBeInTheDocument();
    expect(screen.getByDisplayValue("テストプロジェクト")).toBeInTheDocument();

    fireEvent.click(screen.getByText("キャンセル"));
    await waitFor(() => {
      expect(screen.queryByText("プロジェクト編集")).not.toBeInTheDocument();
    });
  });

  it("プロジェクト名を更新できる", async () => {
    mockFetchProjects.mockResolvedValue({
      projects: [
        {
          id: 1,
          name: "元の名前",
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
    });
    mockUpdateProject.mockResolvedValue({
      id: 1,
      name: "新しい名前",
      created_at: "2026-01-01T00:00:00",
      updated_at: "2026-01-01T00:00:00",
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("元の名前")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("編集"));
    const input = screen.getByDisplayValue("元の名前");
    fireEvent.change(input, { target: { value: "新しい名前" } });
    fireEvent.click(screen.getByText("更新"));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(1, "新しい名前");
    });
  });

  it("削除確認ダイアログが表示される", async () => {
    mockFetchProjects.mockResolvedValue({
      projects: [
        {
          id: 1,
          name: "削除対象",
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("削除対象")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("削除"));
    expect(
      screen.getByText("このプロジェクトを削除しますか？紐づくタスクもすべて削除されます。")
    ).toBeInTheDocument();
  });

  it("プロジェクトを削除できる", async () => {
    mockFetchProjects.mockResolvedValue({
      projects: [
        {
          id: 1,
          name: "削除対象",
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
    });
    mockDeleteProject.mockResolvedValue(undefined);
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("削除対象")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("削除"));
    fireEvent.click(screen.getAllByText("削除").find((el) => el.closest(".fixed") !== null)!);

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith(1);
    });
  });
});
