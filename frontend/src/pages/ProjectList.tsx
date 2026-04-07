import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProjects, createProject, updateProject, deleteProject, Project, ApiError } from "../lib/api";
import { formatDateTime } from "../lib/date";
import ErrorAlert from "../components/ErrorAlert";

interface ProjectFormDialogProps {
  isOpen: boolean;
  title: string;
  initialName: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

function ProjectFormDialog({
  isOpen,
  title,
  initialName,
  submitLabel,
  onSubmit,
  onCancel,
}: ProjectFormDialogProps) {
  const [name, setName] = useState(initialName);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initialName);
    setErrors([]);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  function validate(): string[] {
    const errs: string[] = [];
    if (!name.trim()) {
      errs.push("プロジェクト名は必須です");
    } else if (name.length > 255) {
      errs.push("プロジェクト名は255文字以内で入力してください");
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    setErrors([]);
    try {
      await onSubmit(name.trim());
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        setErrors(apiErr.errors.map((e) => e.message));
      } else {
        setErrors(["エラーが発生しました"]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>

        <ErrorAlert errors={errors} />

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロジェクト名を入力"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={255}
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {submitting ? "処理中..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ isOpen, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">削除確認</h3>
        <p className="text-gray-700 mb-6">
          このプロジェクトを削除しますか？紐づくタスクもすべて削除されます。
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data.projects);
    } catch {
      setError("プロジェクトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(name: string) {
    await createProject(name);
    setShowCreateDialog(false);
    await loadProjects();
  }

  async function handleEdit(name: string) {
    if (!editingProject) return;
    await updateProject(editingProject.id, name);
    setEditingProject(null);
    await loadProjects();
  }

  async function handleDelete() {
    if (!deletingProject) return;
    try {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
      await loadProjects();
    } catch {
      setError("プロジェクトの削除に失敗しました");
      setDeletingProject(null);
    }
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">プロジェクト一覧</h2>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          新規作成
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">読み込み中...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          プロジェクトがありません
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  No.
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  プロジェクト名
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  作成日時
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <td
                    className="px-4 py-3 text-sm text-gray-500 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  >
                    {index + 1}
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-medium text-gray-900 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  >
                    {project.name}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-gray-500 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  >
                    {formatDateTime(project.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                    >
                      編集
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProject(project);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProjectFormDialog
        isOpen={showCreateDialog}
        title="プロジェクト作成"
        initialName=""
        submitLabel="作成"
        onSubmit={handleCreate}
        onCancel={() => setShowCreateDialog(false)}
      />

      <ProjectFormDialog
        isOpen={editingProject !== null}
        title="プロジェクト編集"
        initialName={editingProject?.name ?? ""}
        submitLabel="更新"
        onSubmit={handleEdit}
        onCancel={() => setEditingProject(null)}
      />

      <DeleteConfirmDialog
        isOpen={deletingProject !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProject(null)}
      />
    </div>
  );
}

export default ProjectList;
