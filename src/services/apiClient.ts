import axios from "axios";

const DEFAULT_BASE_URL = "https://recrewt.me/api/";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  try {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("auth.token");
      const trimmedToken = token?.trim();
      if (trimmedToken) {
        config.headers = config.headers ?? {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = /^Bearer\s+/i.test(trimmedToken)
            ? trimmedToken
            : `Bearer ${trimmedToken}`;
        }
      }
    }
  } catch {
    /* ignore storage access */
  }
  return config;
});

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    const data = response?.data as Record<string, unknown> | undefined;
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.detail === "string" && data.detail) ||
      error.message;
    return message || "Something went wrong, please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong, please try again.";
}
