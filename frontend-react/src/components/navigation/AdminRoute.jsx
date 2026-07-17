import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth.js';

export default function AdminRoute({ children }) {
  const { adminUser, isAdmin } = useAuth();
  const location = useLocation();

  if (!adminUser) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
