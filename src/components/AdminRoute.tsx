import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const isAdminAuthenticated = localStorage.getItem("admin_auth") === "true";

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
