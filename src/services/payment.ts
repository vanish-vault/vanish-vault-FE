import { fetchWithAuth } from "@/src/services/apiClient";

export type CreateSubscriptionResponse = {
  success: boolean;
  message: string;
  data: {
    id: string;
    entity: string;
    plan_id: string;
    customer_email: string | null;
    status: string;
    current_start: number | null;
    current_end: number | null;
    ended_at: number | null;
    quantity: number;
    notes: unknown[];
    charge_at: number | null;
    start_at: number | null;
    end_at: number | null;
    auth_attempts: number;
    total_count: number;
    paid_count: number;
    customer_notify: boolean;
    created_at: number;
    expire_by: number;
    short_url: string;
    has_scheduled_changes: boolean;
    change_scheduled_at: number | null;
    source: string;
    remaining_count: number;
  };
};

async function handleResponse(res: Response) {
  const body = await res.json();
  if (!res.ok) {
    const message = body?.error?.message || body?.message || res.statusText;
    const err = new Error(message) as Error & { details?: unknown };
    err.details = body?.error?.details ?? null;
    throw err;
  }
  return body;
}

export async function createSubscription(
  planId: string,
): Promise<CreateSubscriptionResponse> {
  const res = await fetchWithAuth("/v1/api/payment/create-subscription", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });

  const body = await handleResponse(res);
  return body as CreateSubscriptionResponse;
}
