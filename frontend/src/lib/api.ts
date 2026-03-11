export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  errors?: { field: string; message: string }[];
  error?: string;
}

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "エラーが発生しました" }));
    throw errorData;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

// Tasks API
export async function fetchTasks(status?: string): Promise<{ tasks: Task[] }> {
  const params = status ? `?status=${status}` : "";
  const response = await fetch(`${API_BASE}/tasks${params}`);
  return handleResponse(response);
}

export async function fetchTask(id: number): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${id}`);
  return handleResponse(response);
}

export async function createTask(data: {
  title: string;
  description?: string;
  due_date?: string;
}): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateTask(
  id: number,
  data: { title: string; description?: string }
): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateTaskStatus(
  id: number,
  status: string
): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

// Comments API
export async function fetchComments(
  taskId: number
): Promise<{ comments: Comment[] }> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/comments`);
  return handleResponse(response);
}

export async function createComment(
  taskId: number,
  body: string
): Promise<Comment> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return handleResponse(response);
}

export async function updateComment(
  taskId: number,
  commentId: number,
  body: string
): Promise<Comment> {
  const response = await fetch(
    `${API_BASE}/tasks/${taskId}/comments/${commentId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }
  );
  return handleResponse(response);
}

export async function deleteComment(
  taskId: number,
  commentId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/tasks/${taskId}/comments/${commentId}`,
    { method: "DELETE" }
  );
  return handleResponse(response);
}

// Status utilities
export const STATUS_LABELS: Record<string, string> = {
  todo: "起票",
  in_progress: "進行中",
  done: "完了",
};

export const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};
