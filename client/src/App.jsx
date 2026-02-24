import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./shared/pages/LoginPage";
import { useAuth } from "./utils/AuthContext";
import AdminRoutes from "./admin/adminRoutes";
import StudentRoutes from "./students/studentRoutes";
import "./App.css";

const App = () => {
  const { user, loading, setUser } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LoginPage onLogin={(u) => setUser(u)} />
          }
        />

        <Route
          path="/*"
          element={
            user ? (
              user.role === "ADMIN" || user.role === "SYSTEM_ADMIN" ? (
                <AdminRoutes />
              ) : (
                <StudentRoutes />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;