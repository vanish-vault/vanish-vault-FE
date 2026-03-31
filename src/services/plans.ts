import { fetchWithAuth } from "./apiClient";

const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL as string) ||
  (process.env.BACKEND_URL as string) ||
  "";

type ApiError = Error & { details?: unknown };

function handleResponse(res: Response) {
  return res.json().then((body) => {
    if (!res.ok) {
      const message = body?.error?.message || body?.message || res.statusText;
      const err: ApiError = new Error(message) as ApiError;
      err.details = body?.error?.details ?? null;
      throw err;
    }
    return body;
  });
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  razorpayPlanId: string;
  price: number;
  interval: string;
  features: string[];
  isMostPopular: boolean;
  hasQrCode?: boolean;
  supportType?: string;
  maxSecrets?: number;
  maxFiles?: number;
  maxViews?: number;
  maxFileSize?: number;
  maxFileCount?: number;
  maxExpiry?: number;
  encryptionType?: string;
  hasPasswordProtection?: boolean;
}

export async function getPlans(): Promise<Plan[]> {
  // Use no-store cache to ensure we always attempt a fresh fetch from the backend.
  // This avoids the page remaining stuck on a fallback build-time value.
  const res = await fetch(`${API_BASE}/v1/api/plans`, {
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      // Cache for a short duration to avoid refetching on every render (especially in dev mode).
      revalidate: 60,
    },
  });
  const body = await handleResponse(res);
  return body.data as Plan[];
}

export interface UserPlan {
  plan: {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    description: string;
    razorpayPlanId: string;
    price: number;
    /** Max active secrets. -1 means unlimited */
    maxSecrets: number;
    /** Max file uploads per month. -1 means unlimited */
    maxFiles: number;
    /** Max view limit. -1 means unlimited */
    maxViews: number;
    /** Max size per file in bytes */
    maxFileSize: number;
    /** Max number of files per secret. -1 means unlimited */
    maxFileCount: number;
    /** Max expiry in seconds */
    maxExpiry: number;
    encryptionType: string;
    hasPasswordProtection: boolean;
    supportType: string;
    hasQrCode: boolean;
    isMostPopular: boolean;
    /** Billing interval, e.g. "year", "month" */
    interval: string;
    features: string[];
  };
  /** Current number of active secrets */
  usage: number;
  /** Maximum secrets allowed (-1 = unlimited) */
  total: number;
  /** Files uploaded this calendar month (resets on 1st) */
  monthlyFileUploads: number;
  /** Max file uploads per month (-1 = unlimited) */
  maxFiles: number;
}

export async function getUserPlan(): Promise<UserPlan> {
  const res = await fetchWithAuth("/v1/api/plans/user-plan");
  const body = await res.json();
  if (!res.ok) {
    const message = body?.error?.message || body?.message || res.statusText;
    throw new Error(message);
  }
  return body.data as UserPlan;
}
