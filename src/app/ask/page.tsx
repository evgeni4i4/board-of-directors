"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ADVISORS, CATEGORIES } from "@/data/advisors";
import type { Advisor, AdvisorCategory } from "@/types";
import { ArrowRight, X, Lock, Loader2 } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);

  // Fetch usage on mount
  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
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
            setSelectedSlugs(
              recs.slice(0, maxAdvisors).map((r: { slug: string }) => r.slug)
            );
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, advisorSlugs: selectedSlugs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push(`/results/${data.queryId}`);
    } catch {
      setError("Something went wrong. Please try again.");
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
        {usage && usage.queriesLimit !== null && (
          <div className="mb-6 rounded-lg border border-border bg-zinc-50 px-4 py-2 text-sm text-muted-foreground">
            {usage.queriesUsed}/{usage.queriesLimit} free queries used this week
            {usage.queriesUsed >= (usage.queriesLimit ?? 0) && (
              <span className="ml-2 font-medium text-destructive">
                — Limit reached.{" "}
                <a href="/pricing" className="underline">
                  Upgrade to Pro
                </a>
              </span>
            )}
          </div>
        )}

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
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Finding the best advisors...
            </p>
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-40 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {recommended.length > 0 && !recommending && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium">Recommended for you:</p>
            <div className="flex flex-wrap gap-3">
              {recommended.map((rec) => {
                const advisor = ADVISORS.find((a) => a.slug === rec.slug);
                if (!advisor) return null;
                const isSelected = selectedSlugs.includes(rec.slug);
                return (
                  <button
                    key={rec.slug}
                    onClick={() => toggleAdvisor(rec.slug)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white"
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
                      <div className="text-sm font-medium">{advisor.name}</div>
                      <div
                        className={`text-xs ${isSelected ? "text-white/70" : "text-muted-foreground"}`}
                      >
                        {rec.reason.slice(0, 50)}
                        {rec.reason.length > 50 ? "..." : ""}
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
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === key
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
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
                  className={`relative flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
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

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            question.trim().length < 10 ||
            selectedSlugs.length === 0
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
