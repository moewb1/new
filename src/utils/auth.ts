export type AuthRole = "provider" | "consumer";

export interface AuthState {
  authenticated: boolean;
  role?: AuthRole;
  guest?: boolean;
  verifiedAt?: string;
  approvedAt?: string;
}

export const AUTH_CHANGED_EVENT = "auth.changed";

const AUTH_KEY = "auth";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function emitAuthChanged(next: AuthState): void {
  if (!isBrowser) return;
  try {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: next }));
  } catch {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

function safeParseAuth(): Record<string, unknown> | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function normaliseRole(value: unknown): AuthRole | undefined {
  return value === "provider" || value === "consumer" ? value : undefined;
}

export function getAuthState(): AuthState {
  const parsed = safeParseAuth();
  if (!parsed) return { authenticated: false };
  const state: AuthState = {
    authenticated: Boolean(parsed.authenticated),
  };
  const guest = parsed.guest;
  if (typeof guest === "boolean") state.guest = guest;
  const role = normaliseRole(parsed.role);
  if (role) state.role = role;
  if (typeof parsed.verifiedAt === "string") state.verifiedAt = parsed.verifiedAt;
  if (typeof parsed.approvedAt === "string") state.approvedAt = parsed.approvedAt;
  return state;
}

export function setAuthState(next: AuthState): void {
  if (!isBrowser) return;
  const payload: AuthState = {
    authenticated: Boolean(next.authenticated),
    guest: Boolean(next.guest),
    role: normaliseRole(next.role),
    verifiedAt: next.verifiedAt,
    approvedAt: next.approvedAt,
  };
  // Avoid storing undefined keys for cleanliness
  const serialisable: Record<string, unknown> = {
    authenticated: payload.authenticated,
  };
  if (payload.role) serialisable.role = payload.role;
  if (payload.guest) serialisable.guest = true;
  if (payload.verifiedAt) serialisable.verifiedAt = payload.verifiedAt;
  if (payload.approvedAt) serialisable.approvedAt = payload.approvedAt;
  try {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(serialisable));
  } catch {
    /* ignore storage failures */
  }
  emitAuthChanged(payload);
}

export function updateAuthState(patch: Partial<AuthState>): AuthState {
  const current = getAuthState();
  const next: AuthState = {
    authenticated: Boolean(patch.authenticated ?? current.authenticated),
    guest: patch.guest ?? current.guest ?? false,
    role: patch.role ?? current.role,
    verifiedAt: patch.verifiedAt ?? current.verifiedAt,
    approvedAt: patch.approvedAt ?? current.approvedAt,
  };
  setAuthState(next);
  return next;
}

export function clearAuthState(): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem("auth.token");
    window.localStorage.removeItem("auth.refresh");
  } catch {
    /* ignore */
  }
  emitAuthChanged({ authenticated: false });
}

export function isGuestUser(auth: AuthState = getAuthState()): boolean {
  return Boolean(auth.guest);
}

export function isGuestConsumer(auth: AuthState = getAuthState()): boolean {
  return auth.role === "consumer" && Boolean(auth.guest);
}

export function isFullyAuthenticated(auth: AuthState = getAuthState()): boolean {
  return auth.authenticated && !auth.guest;
}

export function startGuestSession(role: AuthRole = "consumer"): AuthState {
  const state: AuthState = {
    authenticated: false,
    guest: true,
    role,
  };
  setAuthState(state);
  return state;
}
