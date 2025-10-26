import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { isFullyAuthenticated } from "@/utils/auth";

export function useRedirectIfAuthenticated(redirectTo: string | null | undefined = "/home") {
  const auth = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!redirectTo) return;
    if (isFullyAuthenticated(auth)) {
      navigate(redirectTo, { replace: true, state: { from: location } });
    }
  }, [auth, navigate, redirectTo, location]);
}
