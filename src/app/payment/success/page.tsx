import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-6 py-24">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-lg p-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
        <p className="text-muted-foreground mb-6">
          Your subscription is now active
        </p>
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
