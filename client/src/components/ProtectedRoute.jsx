import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_PATH } from '../constants';
import PageLoader from './PageLoader';

/**
 * Guards a page. Signed-out visitors go to /login; signed-in users whose role
 * isn't allowed are sent to their own dashboard instead.
 */
export default function ProtectedRoute({ roles, children }) {
  const { profile, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!profile) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to={DASHBOARD_PATH[profile.role]} replace />;
  return children;
}
