import { fetchWithAuth } from "./apiClient";

async function handleResponse(res: Response) {
  const body = await res.json();
  if (!res.ok) {
    const message = body?.error?.message || body?.message || res.statusText;
    const err: any = new Error(message);
    err.details = body?.error?.details ?? null;
    throw err;
  }
  return body;
}

export interface SecretData {
  id: string;
  title?: string;
  views: number;
  maxViews: number;
  isBurnable: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  user?: any;
  files?: any[];
  burned?: boolean;
  secret?: string;
  salt?: string;
  password?: string;
}

export interface ListSecretsResult {
  secrets: SecretData[];
  totalActive: number;
  page: number;
  totalPages: number;
}

export async function listSecrets(
  page: number = 1,
  limit: number = 10,
): Promise<ListSecretsResult> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await fetchWithAuth(`/v1/api/secrets?${params.toString()}`);
  const body = await handleResponse(res);
  return body.data as ListSecretsResult;
}

export async function createSecret(payload: {
  secret: Uint8Array<ArrayBufferLike>;
  title?: Uint8Array<ArrayBufferLike>;
  salt?: string;
  views: number;
  password?: string;
  isBurnable: boolean;
  expiresAt: string;
  ipRange?: string;
}) {
  const res = await fetchWithAuth("/v1/api/secrets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await handleResponse(res);
  return body.data as SecretData;
}

export async function getSecret(
  id: string,
  password?: string,
): Promise<SecretData> {
  // Public endpoint – no auth required
  const res = await fetchWithAuth(
    `/v1/api/secrets/${id}`,
    {
      method: "POST",
      body: JSON.stringify(password ? { password } : {}),
    },
    false, // withAuth = false
  );
  const body = await handleResponse(res);
  return body.data as SecretData;
}

export async function checkSecret(
  id: string,
): Promise<{ views: number; expiresAt: string; isPasswordProtected: boolean }> {
  // Public endpoint – no auth required
  const res = await fetchWithAuth(
    `/v1/api/secrets/${id}/check`,
    { method: "GET" },
    false, // withAuth = false
  );
  const body = await handleResponse(res);
  return body.data;
}

export async function deleteSecret(id: string) {
  const res = await fetchWithAuth(`/v1/api/secrets/${id}`, {
    method: "DELETE",
  });
  const body = await handleResponse(res);
  return body;
}
