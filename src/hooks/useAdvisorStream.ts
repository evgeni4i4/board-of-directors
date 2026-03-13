"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface AdvisorStreamState {
  status: "idle" | "connecting" | "streaming" | "complete" | "error";
  content: string;
  quote: string | null;
}

export interface UseAdvisorStreamReturn {
  advisorStates: Record<string, AdvisorStreamState>;
  currentAdvisorSlug: string | null;
  synthesis: string | null;
  status: "idle" | "connecting" | "streaming" | "synthesizing" | "complete" | "error";
  error: string | null;
}

export function useAdvisorStream(
  queryId: string | null,
  advisorSlugs: string[]
): UseAdvisorStreamReturn {
  const [advisorStates, setAdvisorStates] = useState<
    Record<string, AdvisorStreamState>
  >({});
  const [currentAdvisorSlug, setCurrentAdvisorSlug] = useState<string | null>(
    null
  );
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [status, setStatus] = useState<UseAdvisorStreamReturn["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!queryId) return;

    // Initialize advisor states
    const initial: Record<string, AdvisorStreamState> = {};
    for (const slug of advisorSlugs) {
      initial[slug] = { status: "idle", content: "", quote: null };
    }
    setAdvisorStates(initial);
    setStatus("connecting");

    const es = new EventSource(`/api/generate?queryId=${queryId}`);
    eventSourceRef.current = es;

    es.addEventListener("advisor_start", (e) => {
      const data = JSON.parse(e.data);
      setCurrentAdvisorSlug(data.advisorSlug);
      setStatus("streaming");
      setAdvisorStates((prev) => ({
        ...prev,
        [data.advisorSlug]: { status: "streaming", content: "", quote: null },
      }));
    });

    es.addEventListener("advisor_chunk", (e) => {
      const data = JSON.parse(e.data);
      setAdvisorStates((prev) => ({
        ...prev,
        [data.advisorSlug]: {
          ...prev[data.advisorSlug],
          content: (prev[data.advisorSlug]?.content || "") + data.content,
        },
      }));
    });

    es.addEventListener("advisor_complete", (e) => {
      const data = JSON.parse(e.data);
      setAdvisorStates((prev) => ({
        ...prev,
        [data.advisorSlug]: {
          status: "complete",
          content: data.content,
          quote: data.quote,
        },
      }));
    });

    es.addEventListener("synthesis_start", () => {
      setStatus("synthesizing");
      setCurrentAdvisorSlug(null);
    });

    es.addEventListener("synthesis_complete", (e) => {
      const data = JSON.parse(e.data);
      setSynthesis(data.content);
    });

    es.addEventListener("done", () => {
      setStatus("complete");
      es.close();
    });

    es.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        const data = JSON.parse(e.data);
        setError(data.error);
      }
      setStatus("error");
      es.close();
    });

    es.onerror = () => {
      // EventSource auto-reconnects; only handle if readyState is CLOSED
      if (es.readyState === EventSource.CLOSED) {
        setStatus("error");
        setError("Connection lost");
      }
    };

    return () => {
      es.close();
    };
  }, [queryId, advisorSlugs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { advisorStates, currentAdvisorSlug, synthesis, status, error };
}
