import {
  getTokens,
  setTokens,
  clearAuthData,
  refreshAccessToken,
} from "./auth";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL as string) ||
  (process.env.BACKEND_URL as string) ||
  "";

/** Singleton promise to prevent multiple simultaneous refresh calls */
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;

  try {
    const data = await refreshAccessToken(refreshToken);
    // data shape: { user, accessToken, refreshToken }
    setTokens(data.accessToken ?? null, data.refreshToken ?? null);
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempts a token refresh exactly once at a time (even if multiple
 * requests fail simultaneously with 401).
 */
async function ensureRefreshed(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function forceLogout(errorMessage = "Session expired. Please sign in again.") {
  clearAuthData();

  // Store the error message so the sign-in page can show it as a toast/popup
  if (typeof window !== "undefined") {
    sessionStorage.setItem("authError", errorMessage);
    window.location.href = "/sign-in";
  }
}

/**
 * Drop-in replacement for `fetch` that:
 * 1. Attaches the current Bearer token automatically (if `withAuth` is true, default).
 * 2. On 401, refreshes the token and retries the original request once.
 * 3. If the refresh itself returns 401 (or fails), clears auth data, stores an
 *    error message in `sessionStorage`, and redirects to `/sign-in`.
 */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  function buildHeaders(extraHeaders?: HeadersInit): HeadersInit {
    const base: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
      ...(extraHeaders as Record<string, string>),
    };

    if (withAuth) {
      const { accessToken } = getTokens();
      if (accessToken) {
        base["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    return base;
  }

  // First attempt
  let res = await fetch(url, {
    ...options,
    headers: buildHeaders(),
  });

  // Not 401 – return as-is (caller handles non-ok responses)
  if (res.status !== 401 || !withAuth) {
    return res;
  }

  // 401 – try refresh
  const refreshed = await ensureRefreshed();

  if (!refreshed) {
    forceLogout();
    // Return the original 401 response so callers that don't redirect can still handle it
    return res;
  }

  // Retry with the new token
  res = await fetch(url, {
    ...options,
    headers: buildHeaders(),
  });

  if (res.status === 401) {
    forceLogout();
  }

  return res;
}
