"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-zinc-50 px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered strategic advisory
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl sm:leading-[1.1]">
          Get strategic advice from the{" "}
          <span className="bg-gradient-to-r from-zinc-600 to-zinc-900 bg-clip-text text-transparent">
            world&apos;s greatest minds
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
          30+ legendary thinkers. Distinct perspectives. Real frameworks.
          Describe your problem, pick your board, get actionable advice in
          seconds.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/ask"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 px-8 text-base"
            )}
          >
            Get Advice — Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <a
            href="#advisors"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 px-8 text-base"
            )}
          >
            See All Advisors
          </a>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required. 3 free queries per week.
        </p>
      </div>
    </section>
  );
}
