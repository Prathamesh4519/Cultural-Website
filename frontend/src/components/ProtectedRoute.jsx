import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">Loading CultureSpace...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user's role is student but trying to access admin pages, redirect to student dashboard
    if (user.role === 'student') {
      return <Navigate to="/dashboard" replace />;
    }
    // If admin is trying to access student dashboard, redirect to admin dashboard
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
