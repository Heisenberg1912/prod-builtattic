import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthRedirect(authState) {
  const navigate = useNavigate();
  useEffect(() => {
    if (authState?.dashboardPath) {
      navigate("/", { replace: true });
    }
  }, [authState, navigate]);
}
