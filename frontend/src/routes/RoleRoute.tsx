import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/models';
import { ROLE_HOME, ROUTES } from '../utils/constants';

interface RoleRouteProps {
  role: Role;
}

/** Must be nested inside <ProtectedRoute>, so `user` is already loaded. */
export const RoleRoute = ({ role }: RoleRouteProps) => {
  const { user } = useAuth();

  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
};
