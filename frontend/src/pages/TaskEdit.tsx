import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchTask, updateTask, ApiError } from "../lib/api";

function TaskEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const taskId = Number(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  async function loadTask() {
    setLoading(true);
    try {
      const task = await fetchTask(taskId);
      setTitle(task.title);
      setDescription(task.description || "");
    } catch {
      setErrors(["タスクの取得に失敗しました"]);
    } finally {
      setLoading(false);
    }
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!title.trim()) {
      errs.push("タイトルは必須です");
    } else if (title.length > 255) {
      errs.push("タイトルは255文字以内で入力してください");
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
      await updateTask(taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/tasks/${taskId}`);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        setErrors(apiErr.errors.map((e) => e.message));
      } else {
        setErrors(["タスクの更新に失敗しました"]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-500">読み込み中...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">タスク編集</h2>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タスクのタイトルを入力"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="説明を入力してください"
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {submitting ? "更新中..." : "更新"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tasks/${taskId}`)}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskEdit;
