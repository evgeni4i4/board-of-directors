import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-zinc-50/50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-bold text-white">
              BD
            </div>
            <span className="text-sm font-semibold">Board of Directors</span>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/ask" className="hover:text-foreground">
              Get Advice
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-8">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            AI-generated responses inspired by publicly available frameworks and
            writings. Not affiliated with or endorsed by any real individual.
            For educational and entertainment purposes.
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Board of Directors. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
