"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ADVISORS, CATEGORIES } from "@/data/advisors";
import type { AdvisorCategory } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, X, Lock, Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function AskPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<
    { slug: string; reason: string }[]
  >([]);
  const [recommending, setRecommending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    AdvisorCategory | "all"
  >("all");
  const [usage, setUsage] = useState<{
    plan: string;
    queriesUsed: number;
    queriesLimit: number | null;
    advisorsPerQuery: number;
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Fetch usage on mount
  useEffect(() => {
    fetch("/api/usage")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/sign-in";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setUsage(data);
      })
      .catch(() => {})
      .finally(() => setUsageLoading(false));
  }, []);

  // Auto-recommend on question change (debounced)
  useEffect(() => {
    if (question.trim().length < 20) {
      setRecommended([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setRecommending(true);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        if (res.ok) {
          const data = await res.json();
          const recs = data.recommendations.map(
            (r: { slug: string; reason: string }) => ({
              slug: r.slug,
              reason: r.reason,
            })
          );
          setRecommended(recs);
          // Auto-select recommended advisors if none selected
          if (selectedSlugs.length === 0) {
            const maxAdvisors = usage?.advisorsPerQuery ?? 2;
            const userIsPro = usage?.plan === "pro";
            // Filter out pro-only advisors for free users
            const selectable = userIsPro
              ? recs
              : recs.filter((r: { slug: string }) => {
                  const adv = ADVISORS.find((a) => a.slug === r.slug);
                  return adv?.tier !== "pro";
                });
            setSelectedSlugs(
              selectable.slice(0, maxAdvisors).map((r: { slug: string }) => r.slug)
            );
          }
          // Track recommendation
          if (typeof window !== "undefined" && window.plausible) {
            window.plausible("advisor_recommended", {
              props: { advisors: recs.map((r: { slug: string }) => r.slug).join(",") },
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setRecommending(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [question]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxAdvisors = usage?.advisorsPerQuery ?? 2;
  const isPro = usage?.plan === "pro";
  const atLimit =
    usage !== null &&
    usage.queriesLimit !== null &&
    usage.queriesUsed >= usage.queriesLimit;

  const toggleAdvisor = useCallback(
    (slug: string) => {
      setSelectedSlugs((prev) => {
        if (prev.includes(slug)) return prev.filter((s) => s !== slug);
        if (prev.length >= maxAdvisors) return prev;
        return [...prev, slug];
      });
    },
    [maxAdvisors]
  );

  const handleSubmit = async () => {
    setError(null);
    setIsRateLimited(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, advisorSlugs: selectedSlugs }),
      });

      if (res.status === 401) {
        window.location.href = "/sign-in";
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.error?.includes("limit")) {
          setIsRateLimited(true);
          setError("You've reached your free query limit for this week.");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Track query submission
      if (typeof window !== "undefined" && window.plausible) {
        window.plausible("query_submitted", {
          props: {
            advisorCount: String(selectedSlugs.length),
            plan: usage?.plan || "free",
          },
        });
      }

      router.push(`/results/${data.queryId}`);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdvisors =
    categoryFilter === "all"
      ? ADVISORS
      : ADVISORS.filter((a) => a.category === categoryFilter);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold">Ask the Board</h1>
        <p className="mb-8 text-muted-foreground">
          Describe your business challenge and get advice from legendary
          thinkers.
        </p>

        {/* Usage indicator */}
        {usageLoading ? (
          <Skeleton className="mb-6 h-10 w-full rounded-lg" />
        ) : usage && usage.queriesLimit !== null ? (
          <div
            className={cn(
              "mb-6 rounded-lg border px-4 py-2.5 text-sm",
              atLimit
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-border bg-zinc-50 text-muted-foreground"
            )}
          >
            {usage.queriesUsed}/{usage.queriesLimit} free queries used this week
            {atLimit && (
              <span className="ml-2 font-medium">
                —{" "}
                <Link href="/pricing" className="underline hover:no-underline">
                  Upgrade to Pro
                </Link>{" "}
                for unlimited queries
              </span>
            )}
          </div>
        ) : null}

        {/* Question input */}
        <div className="mb-8">
          <Textarea
            placeholder="e.g., I'm building a SaaS tool for recruiters. We have 50 users but struggling to convert free trials to paid. What should I focus on?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[120px] text-base"
            maxLength={2000}
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {question.length}/2000
          </div>
        </div>

        {/* Recommended advisors */}
        {recommending && (
          <div className="mb-6">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Finding the best advisors...
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg sm:w-40" />
              ))}
            </div>
          </div>
        )}

        {recommended.length > 0 && !recommending && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium">Recommended for you:</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              {recommended.map((rec) => {
                const advisor = ADVISORS.find((a) => a.slug === rec.slug);
                if (!advisor) return null;
                const isSelected = selectedSlugs.includes(rec.slug);
                const isLocked = !isPro && advisor.tier === "pro";
                return (
                  <button
                    key={rec.slug}
                    onClick={() => !isLocked && toggleAdvisor(rec.slug)}
                    disabled={isLocked}
                    className={`relative flex items-center gap-2 rounded-lg border px-3 py-3 text-left transition-all sm:py-2 ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : isLocked
                          ? "cursor-not-allowed border-border opacity-60"
                          : "border-border hover:border-zinc-400"
                    }`}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: advisor.accentColor }}
                    >
                      {advisor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {advisor.name}
                        {isLocked && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}
                      </div>
                      <div
                        className={`text-xs ${isSelected ? "text-white/70" : "text-muted-foreground"}`}
                      >
                        {isLocked ? "Pro only" : (
                          <>
                            {rec.reason.slice(0, 50)}
                            {rec.reason.length > 50 ? "..." : ""}
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected advisors chips */}
        {selectedSlugs.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium">
              Selected ({selectedSlugs.length}/{maxAdvisors}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSlugs.map((slug) => {
                const advisor = ADVISORS.find((a) => a.slug === slug);
                if (!advisor) return null;
                return (
                  <Badge
                    key={slug}
                    variant="secondary"
                    className="flex items-center gap-1.5 py-1 pr-1 pl-2.5"
                  >
                    {advisor.name}
                    <button
                      onClick={() => toggleAdvisor(slug)}
                      className="rounded-full p-0.5 hover:bg-zinc-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Full advisor grid */}
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium">Or pick manually:</p>
          <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200"
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key as AdvisorCategory)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoryFilter === key
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredAdvisors.map((advisor) => {
              const isSelected = selectedSlugs.includes(advisor.slug);
              const isLocked = !isPro && advisor.tier === "pro";
              const isDisabled =
                isLocked ||
                (!isSelected && selectedSlugs.length >= maxAdvisors);

              return (
                <button
                  key={advisor.slug}
                  onClick={() => !isLocked && toggleAdvisor(advisor.slug)}
                  disabled={isDisabled && !isSelected}
                  className={`relative flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-50"
                      : isDisabled
                        ? "cursor-not-allowed border-border opacity-50"
                        : "border-border hover:border-zinc-400"
                  }`}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: advisor.accentColor }}
                  >
                    {advisor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">
                      {advisor.name}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {advisor.title}
                    </div>
                  </div>
                  {isLocked && (
                    <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-muted-foreground/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rate limit upgrade prompt */}
        {isRateLimited && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  Weekly limit reached
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Free accounts get 3 queries per week. Upgrade to Pro for
                  unlimited queries, more advisors, and the best AI model.
                </p>
                <Link
                  href="/pricing"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-3"
                  )}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.plausible) {
                      window.plausible("upgrade_clicked", {
                        props: { source: "rate_limit" },
                      });
                    }
                  }}
                >
                  Upgrade to Pro
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !isRateLimited && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            question.trim().length < 10 ||
            selectedSlugs.length === 0 ||
            atLimit
          }
          className="h-12 w-full text-base sm:w-auto sm:px-8"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating query...
            </>
          ) : (
            <>
              Ask the Board
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
