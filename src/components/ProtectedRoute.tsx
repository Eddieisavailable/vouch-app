import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode, requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { auth } = useAuth();

  if (auth.isLoading) return <div className="h-screen w-screen flex items-center justify-center p-4">Loading auth state...</div>;

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin access check
  if (requireAdmin && auth.user?.user_type !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // For non-admins, check approval status before letting them into actual views
  // except if they are just trying to access the waiting page
  if (!requireAdmin && !auth.user?.is_approved && auth.user?.user_type !== 'admin' && location.pathname !== '/waiting') {
    return <Navigate to="/waiting" replace />;
  }

  return <>{children}</>;
};
