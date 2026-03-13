"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/landing/navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FEATURES = [
  { name: "Queries per week", free: "3", pro: "Unlimited" },
  { name: "Advisors per query", free: "2", pro: "Up to 6" },
  { name: "Advisor roster", free: "Top 12", pro: "Full 30+" },
  { name: "Query history", free: "Last 5", pro: "Unlimited" },
  { name: "Share cards", free: "With watermark", pro: "Clean" },
  { name: "Follow-up questions", free: "No", pro: "Yes" },
  { name: "URL analysis", free: "No", pro: "Yes" },
  { name: "Export", free: "No", pro: "PDF & Markdown" },
  { name: "AI model", free: "Sonnet (fast)", pro: "Opus (best)" },
];

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);

  const handleUpgrade = async (interval: "monthly" | "annual") => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }
    setLoading(interval);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your plan
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Start free, upgrade when you need more firepower.
          </p>

          {/* Annual toggle */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-zinc-50 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !annual ? "bg-white shadow-sm" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                annual ? "bg-white shadow-sm" : "text-muted-foreground"
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-600">Save 35%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free plan */}
          <div className="rounded-2xl border border-border p-8">
            <h2 className="text-lg font-semibold">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">forever</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Perfect for trying it out
            </p>
            <Link
              href={isSignedIn ? "/ask" : "/sign-up"}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-6 w-full"
              )}
            >
              {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
            </Link>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li
                  key={f.name}
                  className="flex items-start gap-2 text-sm"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span>
                    <span className="font-medium">{f.name}:</span> {f.free}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro plan */}
          <div className="relative rounded-2xl border-2 border-zinc-900 p-8 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-1 text-xs font-medium text-white">
              Most Popular
            </div>
            <h2 className="text-lg font-semibold">Pro</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">
                {annual ? "$149" : "$19"}
              </span>
              <span className="text-muted-foreground">
                /{annual ? "year" : "month"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Full power for serious founders
            </p>
            <Button
              onClick={() =>
                handleUpgrade(annual ? "annual" : "monthly")
              }
              disabled={loading !== null}
              className="mt-6 w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Upgrade to Pro
            </Button>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li
                  key={f.name}
                  className="flex items-start gap-2 text-sm"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-900" />
                  <span>
                    <span className="font-medium">{f.name}:</span> {f.pro}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
