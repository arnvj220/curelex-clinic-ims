import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    // Save the attempted path for redirect after login
    sessionStorage.setItem("ims_redirectPath", window.location.pathname);
    return <Navigate to="/ims/login" replace />;
  }

  return children;
};

export default ProtectedRoute;