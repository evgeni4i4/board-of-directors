"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { useAdvisorStream } from "@/hooks/useAdvisorStream";
import { ADVISORS, CATEGORIES } from "@/data/advisors";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Share2,
  MessageSquare,
} from "lucide-react";

interface QueryData {
  id: string;
  question: string;
  advisor_slugs: string[];
  status: string;
  synthesis: string | null;
}

interface ResponseData {
  advisor_slug: string;
  content: string;
  quote: string | null;
}

export default function ResultsPage() {
  const params = useParams();
  const queryId = params.queryId as string;

  const [query, setQuery] = useState<QueryData | null>(null);
  const [existingResponses, setExistingResponses] = useState<
    ResponseData[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  // Fetch query data
  useEffect(() => {
    async function fetchQuery() {
      try {
        const res = await fetch(`/api/query/${queryId}`);
        if (res.ok) {
          const data = await res.json();
          setQuery(data.query);
          if (data.query.status === "complete") {
            setExistingResponses(data.responses);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchQuery();
  }, [queryId]);

  const shouldStream =
    query && query.status !== "complete" && query.status !== "error";

  const { advisorStates, currentAdvisorSlug, synthesis, status } =
    useAdvisorStream(
      shouldStream ? queryId : null,
      (query?.advisor_slugs as string[]) || []
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <Skeleton className="mb-4 h-8 w-2/3" />
          <Skeleton className="mb-8 h-4 w-1/2" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="mb-4 h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-2xl font-bold">Query not found</h1>
          <p className="mt-2 text-muted-foreground">
            This query may have been deleted or doesn&apos;t exist.
          </p>
          <Link
            href="/ask"
            className={cn(buttonVariants(), "mt-6")}
          >
            Ask a new question
          </Link>
        </div>
      </div>
    );
  }

  const advisorSlugs = query.advisor_slugs as string[];
  const isComplete = query.status === "complete" || status === "complete";
  const displaySynthesis =
    query.status === "complete" ? query.synthesis : synthesis;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Question header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Your question
          </div>
          <h1 className="text-xl font-semibold leading-relaxed sm:text-2xl">
            {query.question}
          </h1>
        </div>

        {/* Progress indicator */}
        {!isComplete && (
          <div className="mb-8 flex items-center gap-3 rounded-lg border border-border bg-zinc-50 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            <span className="text-sm text-muted-foreground">
              {status === "connecting" && "Connecting to advisors..."}
              {status === "streaming" &&
                currentAdvisorSlug &&
                `${ADVISORS.find((a) => a.slug === currentAdvisorSlug)?.name} is thinking...`}
              {status === "synthesizing" && "Synthesizing all perspectives..."}
            </span>
          </div>
        )}

        {/* Advisor response cards */}
        <div className="space-y-6">
          {advisorSlugs.map((slug) => {
            const advisor = ADVISORS.find((a) => a.slug === slug);
            if (!advisor) return null;

            // Get content from either stream or existing responses
            const streamState = advisorStates[slug];
            const existingResponse = existingResponses?.find(
              (r) => r.advisor_slug === slug
            );
            const content =
              existingResponse?.content || streamState?.content || "";
            const cardStatus =
              existingResponse
                ? "complete"
                : streamState?.status || "idle";

            return (
              <div
                key={slug}
                className="overflow-hidden rounded-xl border border-border"
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-3 border-b px-5 py-3"
                  style={{
                    backgroundColor: `${advisor.accentColor}08`,
                    borderBottomColor: `${advisor.accentColor}20`,
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: advisor.accentColor }}
                  >
                    {advisor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{advisor.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {advisor.title}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px]"
                    style={{
                      backgroundColor: `${advisor.accentColor}10`,
                      color: advisor.accentColor,
                    }}
                  >
                    {CATEGORIES[advisor.category].label}
                  </Badge>
                  {cardStatus === "complete" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {cardStatus === "streaming" && (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  )}
                </div>

                {/* Card body */}
                <div className="px-5 py-4">
                  {cardStatus === "idle" ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-zinc max-w-none">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Synthesis section */}
        {displaySynthesis && (
          <>
            <Separator className="my-8" />
            <div className="rounded-xl border-2 border-zinc-200 bg-zinc-50 p-6">
              <h2 className="mb-4 text-lg font-bold">Board Synthesis</h2>
              <div className="prose prose-sm prose-zinc max-w-none">
                <ReactMarkdown>{displaySynthesis}</ReactMarkdown>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        {isComplete && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ask"
              className={cn(buttonVariants(), "gap-2")}
            >
              Ask another question
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "gap-2"
              )}
            >
              <Share2 className="h-4 w-4" />
              Share results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
