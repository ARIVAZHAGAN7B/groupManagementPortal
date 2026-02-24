import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";

import AdminRoutes from "../../admin/adminRoutes";
import StudentRoutes from "../../students/studentRoutes";

import AdminLayout from "../../admin/components/layout/adminLayout";

const DashboardGate = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") return <AdminLayout />;
  if (user.role === "STUDENT") return <StudentRoutes />;

  return <Navigate to="/login" replace />;
};

export default DashboardGate;
