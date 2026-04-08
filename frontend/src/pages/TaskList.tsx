import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchTasks, fetchProject, Task, Project, STATUS_LABELS, STATUS_COLORS } from "../lib/api";
import { formatDate } from "../lib/date";

function TaskList() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const numericProjectId = projectId ? Number(projectId) : undefined;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [statusFilter, numericProjectId]);

  useEffect(() => {
    if (numericProjectId) {
      fetchProject(numericProjectId)
        .then(setProject)
        .catch(() => setProject(null));
    }
  }, [numericProjectId]);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks(statusFilter || undefined, numericProjectId);
      setTasks(data.tasks);
    } catch {
      setError("タスクの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {project && (
        <div className="mb-4 text-sm text-gray-500">
          <button
            onClick={() => navigate("/projects")}
            className="text-blue-600 hover:underline"
          >
            プロジェクト一覧
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-700 font-medium">{project.name}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">タスク一覧</h2>
        <div className="flex gap-3">
          {projectId && (
            <button
              onClick={() => navigate("/projects")}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              戻る
            </button>
          )}
          <button
            onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/new` : "/tasks/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            新規作成
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">
          ステータス:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">すべて</option>
          <option value="todo">起票</option>
          <option value="in_progress">進行中</option>
          <option value="done">完了</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">読み込み中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          タスクがありません
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
                  タイトル
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  ステータス
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  期限
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr
                  key={task.id}
                  onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/${task.id}` : `/tasks/${task.id}`)}
                  className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {task.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(task.due_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TaskList;
