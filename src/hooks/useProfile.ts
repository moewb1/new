import { useEffect, useState, useCallback } from "react";
import { fetchProfile, type ProfileResponse } from "@/services/profileService";

interface UseProfileOptions {
  fetchOnMount?: boolean;
}

interface UseProfileResult {
  profile: ProfileResponse | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProfile(options: UseProfileOptions = {}): UseProfileResult {
  const { fetchOnMount = true } = options;
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState<UseProfileResult["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await fetchProfile();
      setProfile(data);
      setStatus("succeeded");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load profile. Please try again.";
      setError(message);
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      refresh();
    }
  }, [fetchOnMount, refresh]);

  return { profile, status, error, refresh };
}
