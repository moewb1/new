import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT, getAuthState } from "@/utils/auth";
import type { AuthState } from "@/utils/auth";

export function useAuthState(): AuthState {
  const [auth, setAuth] = useState<AuthState>(() => getAuthState());

  useEffect(() => {
    const sync = () => setAuth(getAuthState());
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return auth;
}
