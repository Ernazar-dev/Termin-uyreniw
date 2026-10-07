import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Dashboard quick actions navigate with `state: { create: true }`;
 * the target page then opens its "add" modal right away.
 */
export const useOpenCreateFromState = (openCreate: () => void) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!(location.state as { create?: boolean } | null)?.create) return;
    openCreate();
    // Clear the flag so refreshing or going back does not reopen the modal
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, openCreate]);
};
