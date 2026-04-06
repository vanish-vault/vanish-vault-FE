"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Shield, Crown, Check } from "lucide-react";

import { Button, Card } from "@/src/components/ui";
import { createSubscription } from "@/src/services/payment";
import { getUserPlan } from "@/src/services/plans";
import { useAppSelector } from "@/src/store/hooks";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface PlanCardItem {
  id?: string;
  razorpayPlanId: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
  limitations?: string[];
}

const STORAGE_KEY = "vanishvault_payment";

export function getStoredPaymentObject() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredPaymentObject(obj: unknown) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

interface PricingPlansClientProps {
  plans: PlanCardItem[];
  isUsingApi: boolean;
  apiError: string | null;
}

export default function PricingPlansClient({
  plans,
  isUsingApi,
  apiError,
}: PricingPlansClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isCreating, setIsCreating] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserPlan()
      .then((data) => {
        // Pro plan has maxFiles === -1 (unlimited)
        setIsProUser(
          data.maxFiles === -1 ||
            data.plan?.name?.toLowerCase().includes("pro") ||
            false,
        );
      })
      .catch(() => {
        // Fail silently – button remains enabled
      });
  }, [isAuthenticated]);

  const handleGetStarted = async (plan: PlanCardItem) => {
    const isPro = plan.name.toLowerCase().includes("pro");

    if (!isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (!isPro) {
      router.push("/create");
      return;
    }

    if (!plan.razorpayPlanId) {
      toast.error("Unable to determine plan ID. Please try again.");
      return;
    }

    console.log("Creating subscription for plan:", plan);

    setIsCreating(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load Razorpay SDK. Are you online?");
        setIsCreating(false);
        return;
      }

      const response = await createSubscription(plan.razorpayPlanId);
      const subscription = response.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscription.id,
        name: "Vanish Vault",
        description: `Pro Plan – Yearly Subscription`,
        image: `${window.location.origin}/favicon.png`,
        handler: function (response: any) {
          toast.success("Payment Successful!");
          router.push(
            `/payment/success?subId=${encodeURIComponent(subscription.id)}`,
          );
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#6c54f3ff",
        },
      };
      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (response: any) {
        toast.error(response.error.description || "Payment failed");
        router.push(`/payment/failure?subId=${subscription.id}`);
      });

      paymentObject.open();

      const paymentObjectStore = {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        shortUrl: subscription.short_url,
        callbackUrl: `${window.location.origin}/payment/callback?subId=${encodeURIComponent(
          subscription.id,
        )}`,
        successUrl: `${window.location.origin}/payment/success?subId=${encodeURIComponent(
          subscription.id,
        )}`,
        failureUrl: `${window.location.origin}/payment/failure?subId=${encodeURIComponent(
          subscription.id,
        )}`,
      };
      setStoredPaymentObject(paymentObjectStore);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(
        message || "Something went wrong while creating the subscription.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
        {plans.map((plan) => {
          const Icon = plan.name.toLowerCase().includes("pro") ? Crown : Shield;

          return (
            <Card
              key={plan.name}
              className={`p-8 h-full flex flex-col ${
                plan.popular
                  ? "border-2 border-indigo-500 shadow-2xl shadow-indigo-500/25 relative scale-105"
                  : "border-border/50 bg-card/50 backdrop-blur-sm"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white font-semibold shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      plan.popular
                        ? "bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] shadow-lg"
                        : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`size-6 ${
                        plan.popular ? "text-white" : "text-foreground"
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    {plan.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-500">
                        Live
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{plan.description}</p>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/ {plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-green-500/20 shrink-0 mt-0.5">
                      <span className="text-green-500">✓</span>
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className={`w-full gap-2 ${
                  plan.popular
                    ? "bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleGetStarted(plan)}
                disabled={
                  isCreating ||
                  (plan.name.toLowerCase().includes("pro") &&
                    isAuthenticated &&
                    isProUser)
                }
              >
                {plan.name.toLowerCase().includes("pro") &&
                isAuthenticated &&
                isProUser ? (
                  <>
                    <Check className="size-4" />
                    Current Plan
                  </>
                ) : isCreating && plan.name.toLowerCase().includes("pro") ? (
                  "Starting..."
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
