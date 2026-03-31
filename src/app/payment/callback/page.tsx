"use client";

import { useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "vanishvault_payment";

export default function PaymentCallbackPage() {
  const [payment] = useState<null | Record<string, unknown>>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-6 py-24">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-lg p-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Callback</h1>
        <p className="text-muted-foreground mb-4">
          This page is used to complete the payment flow.
        </p>
        {payment ? (
          <div className="space-y-4">
            <p className="text-sm">
              Subscription: <strong>{String(payment.subscriptionId)}</strong>
            </p>
            <p className="text-sm">
              Plan: <strong>{String(payment.planId)}</strong>
            </p>
            <p className="text-sm">
              If you were redirected here from the payment provider, click the
              button below to continue.
            </p>
            <Link
              href={String(payment.shortUrl ?? "/pricing")}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-6 py-3 text-white font-semibold shadow-lg hover:opacity-90"
            >
              Continue Payment
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No payment information found. Please start again from the pricing
            page.
          </p>
        )}
        <div className="mt-6">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full border border-border/50 bg-card/50 px-6 py-3 text-sm font-semibold hover:bg-muted"
          >
            Back to pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
