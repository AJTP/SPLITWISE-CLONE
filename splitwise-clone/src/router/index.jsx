import { createBrowserRouter, Navigate } from "react-router-dom";
import useAuthStore from "../store/auth.store";

import LoadingPage from "../pages/LoadingPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import GroupDetailPage from "../pages/GroupDetailPage";

function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return !accessToken ? children : <Navigate to="/home" replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoadingPage />,
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/group/:id",
    element: (
      <ProtectedRoute>
        <GroupDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
