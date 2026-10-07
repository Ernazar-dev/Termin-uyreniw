import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '../components';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME, ROUTES } from '../utils/constants';

/** Only signed-in users; others are sent to the login page and returned afterwards. */
export const ProtectedRoute = () => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader fullScreen />;
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
};

/** Login / register pages are pointless for a signed-in user. */
export const GuestRoute = () => {
  const { user, initializing } = useAuth();

  if (initializing) return <PageLoader fullScreen />;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
};
