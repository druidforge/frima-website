"use client";

import { ChromatophoreField } from "@/components/chromatophore-field";
import { Reveal, RevealWords } from "@/components/motion-primitives";

/** Shared page opener. Every inner page starts on the same rhythm. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  seed = 33,
  hue = [0, 0],
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  seed?: number;
  hue?: [number, number];
  children?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-clip pb-16 pt-[9rem] md:pb-24 md:pt-[11rem]">
      {/* No silhouette here, so there is nothing to touch - the field stays
          ambient rather than trailing the cursor across the header. */}
      <ChromatophoreField
        seed={seed}
        hue={hue}
        spacing={24}
        intensity={0.55}
        interactive={false}
        className="opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_25%_40%,var(--color-paper)_20%,transparent_80%)]"
      />
      <div className="shell relative z-10">
        <p className="eyebrow">{eyebrow}</p>
        <RevealWords
          text={title}
          as="h1"
          className="mt-5 max-w-[16ch] font-display text-(length:--text-step-4) font-bold tracking-[-0.04em]"
        />
        {lead ? (
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-[58ch] text-(length:--text-step-1) leading-[1.55] text-ink-soft">
              {lead}
            </p>
          </Reveal>
        ) : null}
        {children}
      </div>
    </header>
  );
}
