import { setAuthState, type AuthRole } from "@/utils/auth";
import { fetchProfile } from "@/services/profileService";

const TOKEN_KEYS = [
  "bearer_token",
  "bearerToken",
  "access_token",
  "accessToken",
  "token",
];
const REFRESH_KEYS = ["refresh_token", "refreshToken"];

function extractToken(payload: unknown, keys: string[]): string | undefined {
  if (!payload) return undefined;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof payload !== "object") return undefined;

  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  const visited = new Set<unknown>();
  const queue: unknown[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;

    if (typeof current === "string") {
      const trimmed = current.trim();
      if (trimmed.length > 0) return trimmed;
      continue;
    }

    if (typeof current !== "object") continue;

    visited.add(current);

    if (Array.isArray(current)) {
      current.forEach((value) => {
        if (value && typeof value === "object" && !visited.has(value)) {
          queue.push(value);
        }
      });
      continue;
    }

    const record = current as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      const lowerKey = key.toLowerCase();
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length === 0) continue;
        if (keySet.has(lowerKey) || /^bearer\s+/i.test(trimmed)) {
          return trimmed;
        }
      } else if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string") {
            const trimmedEntry = entry.trim();
            if (
              trimmedEntry.length > 0 &&
              (keySet.has(lowerKey) || /^bearer\s+/i.test(trimmedEntry))
            ) {
              return trimmedEntry;
            }
          } else if (entry && typeof entry === "object" && !visited.has(entry)) {
            queue.push(entry);
          }
        }
      } else if (value && typeof value === "object" && !visited.has(value)) {
        queue.push(value);
      }
    }
  }

  return undefined;
}

const FIRST_NAME_KEYS = ["fname", "first_name", "firstName", "given_name", "givenName"];
const LAST_NAME_KEYS = ["lname", "last_name", "lastName", "family_name", "familyName", "surname"];

function extractNamePart(payload: unknown, keys: string[]): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const queue: unknown[] = [payload];
  const visited = new Set<unknown>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    const obj = current as Record<string, unknown>;
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    Object.values(obj).forEach((value) => {
      if (value && typeof value === "object" && !visited.has(value)) {
        queue.push(value);
      }
    });
  }
  return undefined;
}

function extractRole(payload: unknown): AuthRole | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const queue: unknown[] = [payload];
  const visited = new Set<unknown>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    const obj = current as Record<string, unknown>;
    const raw = obj.role;
    if (raw === "provider" || raw === "consumer") return raw;
    if (Array.isArray(raw)) {
      for (const value of raw) {
        if (value === "provider" || value === "consumer") return value;
      }
    }
    Object.values(obj).forEach((value) => {
      if (value && typeof value === "object" && !visited.has(value)) {
        queue.push(value);
      }
    });
  }
  return undefined;
}

interface PersistOptions {
  response: unknown;
  email: string;
  role?: AuthRole;
  fname?: string;
  lname?: string;
}

export async function persistAuthenticatedSession(options: PersistOptions): Promise<AuthRole | undefined> {
  const { response, email } = options;
  let resolvedRole: AuthRole | undefined = options.role ?? extractRole(response);
  const fname = options.fname ?? extractNamePart(response, FIRST_NAME_KEYS);
  const lname = options.lname ?? extractNamePart(response, LAST_NAME_KEYS);

  const accessToken = extractToken(response, TOKEN_KEYS);
  const refreshToken = extractToken(response, REFRESH_KEYS);

  if (accessToken) {
    const trimmedAccessToken = accessToken.trim();
    if (trimmedAccessToken.length > 0) {
      const normalisedAccessToken = /^Bearer\s+/i.test(trimmedAccessToken)
        ? trimmedAccessToken
        : `Bearer ${trimmedAccessToken}`;
      try {
        localStorage.setItem("auth.token", normalisedAccessToken);
      } catch {
        /* ignore */
      }
    }
  }
  if (refreshToken) {
    const trimmedRefreshToken = refreshToken.trim();
    if (trimmedRefreshToken.length > 0) {
      try {
        localStorage.setItem("auth.refresh", trimmedRefreshToken);
      } catch {
        /* ignore */
      }
    }
  }

  let profilePayload: Record<string, unknown> = {
    email,
  };
  if (resolvedRole) profilePayload.role = resolvedRole;
  if (fname) {
    profilePayload.fname = fname;
    profilePayload.firstName = fname;
  }
  if (lname) {
    profilePayload.lname = lname;
    profilePayload.lastName = lname;
  }

  try {
    const profileResponse = await fetchProfile();
    const user = profileResponse.user;
    resolvedRole = user.role ?? resolvedRole;
    profilePayload = {
      id: user.id,
      role: resolvedRole,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      firstName: user.fname,
      lastName: user.lname,
      dialCode: user.dial_code,
      phoneNumber: user.phone_number,
      phone: `${user.dial_code || ""}${user.phone_number || ""}`.trim(),
    };
    const primaryAddress = user.addresses?.[0];
    if (primaryAddress) profilePayload.address = primaryAddress;
    if (Array.isArray(user.language_ids)) profilePayload.preferredLanguageIds = user.language_ids;
    if (Array.isArray(user.service_ids)) profilePayload.serviceIds = user.service_ids;

    const identityPayload = {
      phone: `${user.dial_code || ""}${user.phone_number || ""}`.trim(),
      preferredLanguageIds: user.language_ids ?? [],
      nationalityId: user.nationality?.id ?? null,
      nationalityCode: user.nationality?.code ?? null,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("kyc.identity", JSON.stringify(identityPayload));
    } catch {
      /* ignore */
    }
  } catch {
    /* fallback already prepared */
  }

  try {
    localStorage.setItem("profile", JSON.stringify(profilePayload));
  } catch {
    /* ignore */
  }

  setAuthState({
    authenticated: true,
    role: resolvedRole,
    verifiedAt: new Date().toISOString(),
  });

  return resolvedRole;
}
