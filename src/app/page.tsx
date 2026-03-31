// src/app/page.tsx
import Link from "next/link";
import { Shield, Clock, Lock, Eye, Printer, Check, Crown, ArrowRight } from "lucide-react";

import { Button, Card } from "@/src/components/ui";
import { HeroSection } from "@/src/components/landing";
import { AnimatedSection } from "@/src/components/animation";
import { getPlans, Plan } from "@/src/services/plans";

const features = [
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description:
      "Military-grade AES-256 encryption ensures your data stays private",
  },
  {
    icon: Clock,
    title: "Expiry Timer",
    description: "Set custom expiration times from 1 hour to 30 days",
  },
  {
    icon: Lock,
    title: "Password Protection",
    description: "Add an extra layer of security with optional passwords",
  },
  {
    icon: Eye,
    title: "View Limits",
    description: "Control how many times your link can be accessed",
  },
  {
    icon: Printer,
    title: "Direct Browser Print",
    description: "Print-optimized layouts for professional document sharing",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create",
    description:
      "Upload your file or paste your text, configure security settings",
  },
  {
    step: "02",
    title: "Share",
    description: "Copy the generated secure link or scan the QR code",
  },
  {
    step: "03",
    title: "Self-Destruct",
    description: "Link automatically expires based on your settings",
  },
];

const defaultPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    popular: false,
    features: [
      "Unlimited secure links",
      "Up to 1MB file size",
      "Up to 3 file uploads per month",
      "24 hour maximum expiry",
      "Basic AES-256 encryption",
      "Password protection",
      "View limits",
      "QR code generation",
    ],
  },
  {
    name: "Pro",
    price: "₹499",
    period: "per year",
    popular: true,
    features: [
      "Unlimited secure links",
      "Up to 100MB file size",
      "Unlimited file uploads per month",
      "30 day maximum expiry",
      "Advanced AES-256 encryption",
      "Password protection",
      "Priority support (24/7)",
      "Unlimited view limits",
      "QR code generation",
    ],
  },
];

function mapApiPlan(plan: Plan) {
  const normalizedPrice =
    typeof plan.price === "number"
      ? plan.price === 0
        ? "₹0"
        : `₹${plan.price}`
      : String(plan.price);

  const normalizedPeriod =
    !plan.interval || plan.interval === "forever"
      ? "forever"
      : `per ${plan.interval}`;

  return {
    name: plan.name,
    price: normalizedPrice,
    period: normalizedPeriod,
    popular: plan.isMostPopular ?? false,
    features: plan.features ?? [],
  };
}

export default async function Home() {
  let plans = defaultPlans;
  try {
    const apiPlans = await getPlans();
    if (apiPlans && apiPlans.length > 0) {
      plans = apiPlans.map(mapApiPlan);
    }
  } catch {
    // silently fall back to defaults
  }

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-blue-500/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMDAsMTAwLDEwMCwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <HeroSection />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for professionals who need to share sensitive information
              securely
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedSection key={feature.title} delay={index * 0.1}>
                <Card className="p-6 h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-indigo-500/50 transition-all duration-300 group">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] inline-block mb-4 shadow-lg shadow-indigo-500/25 group-hover:shadow-xl group-hover:shadow-indigo-500/40 transition-all">
                    <feature.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to secure sharing
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <AnimatedSection
                key={item.step}
                delay={index * 0.1}
                className="relative"
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-indigo-500 to-transparent -translate-x-1/2" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white text-xl font-bold mb-4 shadow-lg shadow-indigo-500/25">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = plan.popular ? Crown : Shield;
              return (
                <AnimatedSection key={plan.name} delay={index * 0.1}>
                  <Card
                    className={`p-8 h-full flex flex-col ${
                      plan.popular
                        ? "border-2 border-indigo-500 shadow-xl shadow-indigo-500/25 relative"
                        : "border-border/50 bg-card/50 backdrop-blur-sm"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white text-sm font-semibold">
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
                            className={`size-6 ${plan.popular ? "text-white" : "text-foreground"}`}
                          />
                        </div>
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">
                          / {plan.period}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="size-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href={plan.popular ? "/pricing" : "/create"}>
                      <Button
                        className={`w-full gap-2 ${
                          plan.popular
                            ? "bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
                            : ""
                        }`}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        {plan.popular ? "Get Started" : "Start Free"}
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection className="text-center mt-10" delay={0.3}>
            <Link href="/pricing">
              <Button
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                View full pricing details
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)]">
                <Shield className="size-5 text-white" />
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] bg-clip-text text-transparent">
                VanishVault
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span>🔒 256-bit AES Encryption</span>
              <span>🌍 GDPR Compliant</span>
              <span>🔐 Zero-Knowledge Architecture</span>
              <span>⚡ SOC 2 Certified</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>
              © 2026 VanishVault. All rights reserved. Your privacy is our
              priority.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
