import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext, normalizeFrontendRole } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="font-display font-medium tracking-wide">Loading Rabas Travel...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedRole = normalizeFrontendRole(user?.role);

  // Role authorization check
  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    // Redirect to home/dashboard based on their actual role
    if (normalizedRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (normalizedRole === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
