import React from "react";
import { Navigate } from "react-router-dom";

// Role -> landing path mapping (dashboards removed)
const roleDashboardPath = {
  superadmin: "/",
  admin: "/",
  vendor: "/",
  firm: "/portal/studio",
  associate: "/portal/associate",
  client: "/",
  user: "/",
};

const ProtectedRoute = ({ allowRoles = [], auth, children }) => {
  // Login is disabled; always render the child route.
  const role = auth?.role || "user";
  if (allowRoles.length && !allowRoles.includes(role)) {
    const target = roleDashboardPath[role] || "/";
    return <Navigate to={target} replace />;
  }
  return children;
};

export default ProtectedRoute;
  
