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

export async function getUploadSignedUrl(
  filename: string,
  contentType: string,
  fileSize: number,
) {
  const res = await fetchWithAuth("/v1/api/files/temp/signed-url", {
    method: "POST",
    body: JSON.stringify({ filename, contentType, fileSize }),
  });

  return handleResponse(res).then((body) => body.data);
}

export async function uploadFileToSignedUrl(signedUrl: string, file: File) {
  // Direct S3 / signed-url upload — no auth header, no base URL prefix
  const res = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload file: ${res.statusText}`);
  }
}
