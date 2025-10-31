import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthRedirect(authState) {
  const navigate = useNavigate();
  useEffect(() => {
    if (authState?.dashboardPath) {
      navigate(authState.dashboardPath, { replace: true });
    }
  }, [authState, navigate]);
}
