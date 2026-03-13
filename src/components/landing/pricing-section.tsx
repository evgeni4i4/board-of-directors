"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try it out — no credit card needed",
    cta: "Get Started Free",
    ctaHref: "/sign-up",
    ctaVariant: "outline" as const,
    features: [
      "3 queries per week",
      "2 advisors per query",
      "Top 12 popular advisors",
      "Last 5 queries in history",
      "Share cards with watermark",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Full power for serious founders",
    cta: "Upgrade to Pro",
    ctaHref: "/pricing",
    ctaVariant: "default" as const,
    highlight: true,
    features: [
      "Unlimited queries",
      "Up to 6 advisors per query",
      "Full roster of 30+ advisors",
      "Unlimited history",
      "Clean share cards",
      "Follow-up questions",
      "URL analysis",
      "PDF & Markdown export",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-zinc-900 shadow-lg"
                  : "border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <Link
                href={plan.ctaHref}
                className={cn(
                  buttonVariants({ variant: plan.ctaVariant }),
                  "mb-6 w-full"
                )}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Annual plan: $149/year (save 35%)
        </p>
      </div>
    </section>
  );
}
