"use client";

import { useEffect } from "react";
import Link from "next/link";

import { bricolage, instrument, jetbrains } from "@/lib/fonts";

import "./globals.css";

/**
 * Catches a crash in `app/[locale]/layout.tsx` itself - the one place
 * `app/[locale]/error.tsx` can't reach, since an error boundary doesn't wrap
 * the layout it sits inside. This replaces the *entire* document when it
 * fires, so - like `app/not-found.tsx` - it renders its own `<html>/<body>`
 * with no i18n (a broken root layout means no locale was ever established)
 * and as few moving parts as possible: no motion, no canvas, nothing that
 * could itself be the reason the page won't render.
 */
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]");
  }, []);

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
        <main className="w-full max-w-md text-center">
          <p className="eyebrow">500</p>
          <h1 className="mt-4 font-display text-[clamp(1.8rem,6vw,2.6rem)] font-bold tracking-[-0.03em]">
            Something broke
          </h1>
          <p className="mt-4 text-ink-soft">
            The page itself failed to load, not just its content. Reloading
            usually fixes it.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={unstable_retry}
              className="rounded-sm bg-ink px-6 py-3.5 font-medium text-paper"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-sm border border-ink/25 px-6 py-3.5 font-medium"
            >
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
