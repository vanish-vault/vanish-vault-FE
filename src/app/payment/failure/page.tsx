"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function FailureContent() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subId");

  return (
    <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-lg p-10 text-center">
      <h1 className="text-3xl font-bold mb-4 text-rose-600">
        Payment Failed
      </h1>
      <p className="text-muted-foreground mb-6">
        Something went wrong while processing your payment
        {subscriptionId ? " (" + subscriptionId + ")" : ""}. Please try again.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-full border border-border/50 bg-card/50 px-6 py-3 text-sm font-semibold hover:bg-muted"
        >
          View Plans
        </Link>
        <Link
          href="/dashboard/secrets"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-6 py-3 text-white font-semibold shadow-lg hover:opacity-90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-6 py-24">
      <Suspense
        fallback={
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-lg p-10 text-center">
            <h1 className="text-3xl font-bold mb-4 text-rose-600">
              Payment Failed
            </h1>
            <p className="text-muted-foreground">Loading details...</p>
          </div>
        }
      >
        <FailureContent />
      </Suspense>
    </div>
  );
}
