import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/** Allows only ADMIN users. Redirects others to /dashboard. */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return children;
}
