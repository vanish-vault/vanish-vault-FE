export const dynamic = "force-dynamic";

import Link from "next/link";

import { Button, Card } from "@/src/components/ui";
import { AnimatedSection } from "@/src/components/animation";
import PricingPlansClient from "./PricingPlansClient";
import { getPlans, Plan } from "@/src/services/plans";

const defaultPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for personal use and trying out VanishVault",
    features: [
      "5 secure links per month",
      "Up to 1MB file size",
      "Up to 3 file uploads per month",
      "24 hour maximum expiry",
      "Basic AES-256 encryption",
      "Password protection",
      "Email support",
      "View limits",
      "QR code generation",
    ],
    limitations: [
      "No custom watermarks",
      "No analytics",
      "Standard support response time",
    ],
  },
  {
    razorpayPlanId: "plan_SRyxRYAMp2Eckp",
    name: "Pro",
    price: "₹499",
    period: "per year",
    popular: true,
    description: "For professionals and teams who need advanced security",
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

interface PlanCardItem {
  id?: string;
  name: string;
  description: string;
  razorpayPlanId: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
  limitations?: string[];
}

function mapPlan(plan: Plan | (typeof defaultPlans)[number]): PlanCardItem {
  const normalizedPrice =
    typeof plan.price === "number" ? `₹${plan.price}` : plan.price;

  const intervalPlan = plan as { interval?: string; period?: string };
  const interval = intervalPlan.interval ?? intervalPlan.period ?? "forever";
  const normalizedPeriod =
    interval === "forever" ? "forever" : `per ${interval}`;

  const popularityPlan = plan as { isMostPopular?: boolean; popular?: boolean };
  const idPlan = plan as { id?: string };
  const limitationsPlan = plan as { limitations?: string[] };

  return {
    id: idPlan.id,
    name: plan.name,
    description: plan.description,
    razorpayPlanId: plan.razorpayPlanId!,
    price: normalizedPrice,
    period: normalizedPeriod,
    features: plan.features,
    limitations: limitationsPlan.limitations,
    popular: popularityPlan.isMostPopular || popularityPlan.popular || false,
  };
}

const features = [
  {
    title: "Military-Grade Encryption",
    description:
      "All data is encrypted using AES-256 encryption before it leaves your device",
  },
  {
    title: "Zero-Knowledge Architecture",
    description:
      "We never have access to your unencrypted data. Your security is guaranteed.",
  },
  {
    title: "Automatic Destruction",
    description:
      "Links automatically expire and content is permanently deleted based on your settings",
  },
  {
    title: "GDPR & SOC 2 Compliant",
    description:
      "Full compliance with international data protection regulations",
  },
  {
    title: "No Data Retention",
    description:
      "Once a link expires, all associated data is permanently and irreversibly deleted",
  },
  {
    title: "Audit Logs (Pro)",
    description:
      "Track who accessed your links and when for compliance purposes",
  },
];

const useCases = [
  {
    title: "Freelancers",
    description:
      "Share client credentials and sensitive project files securely",
    icon: "💼",
  },
  {
    title: "HR Teams",
    description:
      "Distribute employee contracts, salary information, and onboarding documents",
    icon: "👥",
  },
  {
    title: "Legal Professionals",
    description:
      "Share confidential case files and legal documents with clients",
    icon: "⚖️",
  },
  {
    title: "Developers",
    description:
      "Share API keys, credentials, and sensitive configuration files",
    icon: "👨‍💻",
  },
  {
    title: "Healthcare",
    description: "Share patient information while maintaining HIPAA compliance",
    icon: "🏥",
  },
  {
    title: "Financial Services",
    description:
      "Securely share financial documents and sensitive client information",
    icon: "💰",
  },
];

const faqs = [
  {
    q: "How secure is VanishVault?",
    a: "VanishVault uses AES-256 encryption, the same standard used by governments and financial institutions. All data is encrypted on your device before transmission.",
  },
  {
    q: "Can you access my data?",
    a: "No. We use zero-knowledge architecture, meaning we never have access to your unencrypted data. Only you and your recipients can decrypt the content.",
  },
  {
    q: "What happens when a link expires?",
    a: "When a link expires or reaches its view limit, all associated data is permanently and irreversibly deleted from our servers.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately.",
  },
];

export default async function PricingPage() {
  let apiError: string | null = null;

  const plansToRender = await (async () => {
    try {
      const apiPlans = await getPlans();
      return apiPlans.map(mapPlan);
    } catch (err) {
      // Fall back to hand-coded plans if the API is not reachable
      apiError = String(err instanceof Error ? err.message : err);
      console.warn("Failed to fetch plans, using fallback data.", err);
      return defaultPlans.map(mapPlan);
    }
  })();

  const isUsingApi = plansToRender.some((plan) => !!plan.id);

  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-blue-500/20" />

        <div className="relative max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Choose Your Security Level
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start with our free plan or upgrade to Pro for unlimited secure
              sharing with advanced features
            </p>
          </AnimatedSection>

          {/* Pricing Cards */}
          <PricingPlansClient
            plans={plansToRender}
            isUsingApi={isUsingApi}
            apiError={apiError}
          />
        </div>
      </section>

      {/* Security Features */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise-Grade Security for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with security-first principles from the ground up
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedSection key={feature.title} delay={index * 0.1}>
                <Card className="p-6 h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              VanishVault is used by teams across industries for secure sharing
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <AnimatedSection key={useCase.title} delay={index * 0.1}>
                <Card className="p-6 h-full border-border/50 bg-card/50 backdrop-blur-sm group hover:border-indigo-500/50 transition-all duration-300">
                  <div className="text-4xl mb-4">{useCase.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {useCase.description}
                  </p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-blue-500/20" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Secure Your Sharing?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of professionals who trust VanishVault with their
              sensitive data
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90 transition-opacity px-8 shadow-lg shadow-indigo-500/25"
                >
                  Start Free Today
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-border/50 backdrop-blur-sm"
              >
                Contact Sales
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Start in seconds • Cancel anytime
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </AnimatedSection>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <AnimatedSection key={faq.q} delay={index * 0.05}>
                <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
