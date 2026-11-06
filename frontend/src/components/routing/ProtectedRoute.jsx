import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext, normalizeFrontendRole } from '../../contexts/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <LoadingScreen title="Checking your session" detail="We’re getting your account ready." />;
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
