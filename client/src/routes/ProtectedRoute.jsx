import React from "react";
import { Navigate } from "react-router-dom";

// Role -> dashboard mapping
const roleDashboardPath = {
  superadmin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  vendor: "/dashboard/vendor",
  firm: "/dashboard/firm",
  associate: "/dashboard/associate",
  client: "/dashboard/client",
  user: "/dashboard/user",
};

const ProtectedRoute = ({ allowRoles = [], auth, children }) => {
  if (!auth?.loaded) return null; // or a loader
  if (!auth.token) return <Navigate to="/login" replace />;
  if (allowRoles.length && !allowRoles.includes(auth.role)) {
    const target = roleDashboardPath[auth.role] || "/login";
    return <Navigate to={target} replace />;
  }
  return children;
};

export default ProtectedRoute;
  
