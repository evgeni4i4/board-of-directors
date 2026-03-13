"use client";

import { useState } from "react";
import { ADVISORS, CATEGORIES } from "@/data/advisors";
import type { AdvisorCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

const ALL_CATEGORIES = [
  { key: "all" as const, label: "All" },
  ...Object.entries(CATEGORIES).map(([key, val]) => ({
    key: key as AdvisorCategory,
    label: val.label,
  })),
];

export function AdvisorGrid() {
  const [filter, setFilter] = useState<AdvisorCategory | "all">("all");

  const filtered =
    filter === "all"
      ? ADVISORS
      : ADVISORS.filter((a) => a.category === filter);

  return (
    <section id="advisors" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your Advisory Board
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            30 legendary thinkers, each with their own frameworks and perspective
          </p>
        </div>

        {/* Category tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === cat.key
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-border bg-white text-muted-foreground hover:border-zinc-400 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((advisor) => (
            <div
              key={advisor.slug}
              className="group relative flex flex-col items-center rounded-xl border border-border/60 bg-white p-4 text-center transition-all hover:border-border hover:shadow-md"
            >
              {advisor.tier === "pro" && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
              )}

              {/* Avatar placeholder */}
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: advisor.accentColor }}
              >
                {advisor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>

              <h3 className="text-sm font-semibold leading-tight">
                {advisor.name}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {advisor.title}
              </p>

              <Badge
                variant="secondary"
                className="mt-2 text-[10px]"
                style={{
                  backgroundColor: `${advisor.accentColor}10`,
                  color: advisor.accentColor,
                }}
              >
                {CATEGORIES[advisor.category].label}
              </Badge>

              {/* Hover overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-end rounded-xl bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="w-full text-left">
                  <p className="text-[11px] leading-tight text-white/90">
                    {advisor.frameworks.slice(0, 2).join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
