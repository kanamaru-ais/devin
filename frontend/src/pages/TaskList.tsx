import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTasks, Task, STATUS_LABELS, STATUS_COLORS } from "../lib/api";

function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks(statusFilter || undefined);
      setTasks(data.tasks);
    } catch {
      setError("タスクの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  }

  return (
    <div>   
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">タスク一覧</h2>
        <button
          onClick={() => navigate("/tasks/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          新規作成
        </button>
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
                  onClick={() => navigate(`/tasks/${task.id}`)}
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
