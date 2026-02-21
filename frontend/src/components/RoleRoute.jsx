import { Navigate, useLocation } from "react-router-dom";
import Loader from "./Loader";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking permissions..." fullScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
