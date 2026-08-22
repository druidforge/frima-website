import Image from "next/image";
import Link from "next/link";

import { bricolage, instrument, jetbrains } from "@/lib/fonts";

import "./globals.css";

/**
 * 404 for requests that never resolved to a locale at all.
 *
 * This renders its own document: it sits outside `app/[locale]`, so there is no
 * layout, no chrome and - the part that shapes the design - no translations,
 * because no language was ever established. Guessing one would be worse than
 * admitting it, so rather than choosing for the visitor the page offers all
 * three doorways and says the same thing in each.
 *
 * Everything here is static: no canvas, no client JS. Someone who has already
 * hit a dead end should not wait on a bundle to be told so.
 */
const doors = [
  {
    locale: "hr",
    language: "Hrvatski",
    line: "Ova stranica se vratila u vatru.",
    action: "Na početnu",
  },
  {
    locale: "en",
    language: "English",
    line: "This page went back in the fire.",
    action: "Go home",
  },
  {
    locale: "de",
    language: "Deutsch",
    line: "Diese Seite ging zurück ins Feuer.",
    action: "Zur Startseite",
  },
] as const;

export default function RootNotFound() {
  return (
    <html
      lang="hr"
      className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
        <main className="w-full max-w-2xl">
          <Image
            src="/druid-forge.svg"
            alt=""
            width={64}
            height={64}
            priority
            unoptimized
          />

          <p className="eyebrow mt-8">404</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,7vw,3.25rem)] font-bold tracking-[-0.04em]">
            Page not found
          </h1>
          <p className="mt-4 max-w-[46ch] text-ink-soft">
            Metal that will not hold its shape goes back to the forge and gets
            worked again. This link did not hold.
          </p>

          <ul className="mt-10 grid gap-px overflow-clip rounded-md border border-border bg-border">
            {doors.map((door) => (
              <li key={door.locale}>
                <Link
                  href={`/${door.locale}`}
                  hrefLang={door.locale}
                  className="group flex items-center justify-between gap-6 bg-background p-5 transition-colors duration-(--dur-base) ease-out-quint hover:bg-paper"
                >
                  <span>
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-faint">
                      {door.language}
                    </span>
                    <span className="mt-1.5 block text-sm text-ink-soft">
                      {door.line}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm font-medium">
                    {door.action}
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-(--dur-base) ease-out-quint group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
