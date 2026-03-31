import { fetchWithAuth } from "./apiClient";

export interface User {
  id: string;
  username: string;
  email: string;
  // track number of file uploads this month, optional because backend may not send it
  filesUploadedThisMonth?: number;
}

const API_BASE =
  // Prefer public env for client runtime; fall back to non-public if present
  (process.env.NEXT_PUBLIC_BACKEND_URL as string) ||
  (process.env.BACKEND_URL as string) ||
  "";

function handleResponse(res: Response) {
  return res.json().then((body) => {
    if (!res.ok) {
      const message = body?.error?.message || body?.message || res.statusText;
      const err: any = new Error(message);
      err.details = body?.error?.details ?? null;
      throw err;
    }
    return body;
  });
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/v1/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await handleResponse(res);
  // expected shape: { success:true, data: { user, accessToken, refreshToken } }
  return body.data;
}

export async function login(payload: { identifier: string; password: string }) {
  const res = await fetch(`${API_BASE}/v1/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await handleResponse(res);
  return body.data;
}

export async function googleAuth(idToken: string) {
  const res = await fetch(`${API_BASE}/v1/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const body = await handleResponse(res);
  return body.data;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_BASE}/v1/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const body = await handleResponse(res);
  return body.data as { accessToken: string; refreshToken: string };
}

export function setAuthData(
  user: User,
  accessToken: string | null,
  refreshToken: string | null,
) {
  setTokens(accessToken, refreshToken);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

export function setTokens(
  accessToken: string | null,
  refreshToken: string | null,
) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearAuthData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (e) {
    return null;
  }
}

export function getTokens() {
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  };
}

async function handleAuthResponse(res: Response) {
  const body = await res.json();
  if (!res.ok) {
    const message = body?.error?.message || body?.message || res.statusText;
    const err: any = new Error(message);
    err.details = body?.error?.details ?? null;
    throw err;
  }
  return body;
}

export async function updatePassword(payload: {
  oldPassword?: string;
  newPassword: string;
}) {
  const res = await fetchWithAuth("/v1/api/user/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleAuthResponse(res);
}

export async function updateName(name: string) {
  const res = await fetchWithAuth("/v1/api/user/change-name", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return handleAuthResponse(res);
}
