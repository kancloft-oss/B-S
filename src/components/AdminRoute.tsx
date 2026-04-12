import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user || user.email !== "kancloft@gmail.com") {
    return <Navigate to="/account" replace />;
  }

  return children;
};
