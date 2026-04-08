import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchTask,
  fetchComments,
  updateTaskStatus,
  createComment,
  updateComment,
  deleteComment,
  Task,
  Comment,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../lib/api";
import { formatDateTime } from "../lib/date";

function TaskDetail() {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const navigate = useNavigate();
  const taskId = Number(id);

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");

  useEffect(() => {
    loadData();
  }, [taskId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [taskData, commentsData] = await Promise.all([
        fetchTask(taskId),
        fetchComments(taskId),
      ]);
      setTask(taskData);
      setSelectedStatus(taskData.status);
      setComments(commentsData.comments);
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!task || selectedStatus === task.status) return;
    setStatusUpdating(true);
    try {
      const updated = await updateTaskStatus(taskId, selectedStatus);
      setTask(updated);
    } catch {
      setError("ステータスの更新に失敗しました");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleCommentSubmit() {
    if (!newComment.trim()) {
      setCommentError("コメント本文は必須です");
      return;
    }
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      await createComment(taskId, newComment.trim());
      setNewComment("");
      const commentsData = await fetchComments(taskId);
      setComments(commentsData.comments);
    } catch {
      setCommentError("コメントの投稿に失敗しました");
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleCommentEdit(commentId: number) {
    if (!editingCommentBody.trim()) return;
    try {
      await updateComment(taskId, commentId, editingCommentBody.trim());
      setEditingCommentId(null);
      setEditingCommentBody("");
      const commentsData = await fetchComments(taskId);
      setComments(commentsData.comments);
    } catch {
      setCommentError("コメントの編集に失敗しました");
    }
  }

  async function handleCommentDelete(commentId: number) {
    if (!window.confirm("このコメントを削除しますか？")) return;
    try {
      await deleteComment(taskId, commentId);
      const commentsData = await fetchComments(taskId);
      setComments(commentsData.comments);
    } catch {
      setCommentError("コメントの削除に失敗しました");
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-500">読み込み中...</div>;
  }

  if (error && !task) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        {error}
        <button
          onClick={() => navigate(projectId ? `/projects/${projectId}/tasks` : "/tasks")}
          className="ml-4 text-blue-600 underline"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">タスク詳細</h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="w-24 text-sm font-medium text-gray-500 flex-shrink-0">
              タイトル
            </span>
            <span className="text-gray-900 font-medium">{task.title}</span>
          </div>
          <div className="flex items-start">
            <span className="w-24 text-sm font-medium text-gray-500 flex-shrink-0">
              説明
            </span>
            <span className="text-gray-700 whitespace-pre-wrap">
              {task.description || "-"}
            </span>
          </div>
          <div className="flex items-center">
            <span className="w-24 text-sm font-medium text-gray-500 flex-shrink-0">
              ステータス
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">起票</option>
                <option value="in_progress">進行中</option>
                <option value="done">完了</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={statusUpdating || selectedStatus === task.status}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {statusUpdating ? "更新中..." : "更新"}
              </button>
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[task.status]}`}
              >
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>
          <div className="flex items-start">
            <span className="w-24 text-sm font-medium text-gray-500 flex-shrink-0">
              期限
            </span>
            <span className="text-gray-700">
              {task.due_date || "-"}
            </span>
          </div>
          <div className="flex items-start">
            <span className="w-24 text-sm font-medium text-gray-500 flex-shrink-0">
              作成日時
            </span>
            <span className="text-gray-700">
              {formatDateTime(task.created_at)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/${task.id}/edit` : `/tasks/${task.id}/edit`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            編集
          </button>
          <button
            onClick={() => navigate(projectId ? `/projects/${projectId}/tasks` : "/tasks")}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            戻る
          </button>
        </div>
      </div>

      {/* コメントセクション */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">コメント</h3>

        {commentError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
            {commentError}
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">コメントはありません</p>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-gray-200 rounded-md p-3"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {formatDateTime(comment.created_at)}
                  {comment.updated_at !== comment.created_at && " (編集済み)"}
                </div>
                {editingCommentId === comment.id ? (
                  <div>
                    <textarea
                      value={editingCommentBody}
                      onChange={(e) => setEditingCommentBody(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCommentEdit(comment.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingCommentBody("");
                        }}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">
                      {comment.body}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingCommentBody(comment.body);
                        }}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleCommentDelete(comment.id)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力してください"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <button
            onClick={handleCommentSubmit}
            disabled={commentSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {commentSubmitting ? "投稿中..." : "コメント投稿"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetail;
