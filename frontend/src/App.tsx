import { Routes, Route, Navigate, Link } from "react-router-dom";
import ProjectList from "./pages/ProjectList";
import TaskList from "./pages/TaskList";
import TaskCreate from "./pages/TaskCreate";
import TaskDetail from "./pages/TaskDetail";
import TaskEdit from "./pages/TaskEdit";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            <Link to="/projects" className="hover:text-blue-600">
              タスク管理アプリ
            </Link>
          </h1>
          <nav>
            <Link
              to="/projects"
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              プロジェクト一覧
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:projectId/tasks" element={<TaskList />} />
          <Route path="/projects/:projectId/tasks/new" element={<TaskCreate />} />
          <Route path="/projects/:projectId/tasks/:id" element={<TaskDetail />} />
          <Route path="/projects/:projectId/tasks/:id/edit" element={<TaskEdit />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
