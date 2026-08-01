"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { useId } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const labels: Record<Locale, string> = { hr: "HR", en: "EN", de: "DE" };
const titles: Record<Locale, string> = {
  hr: "Hrvatski",
  en: "English",
  de: "Deutsch",
};

/**
 * Switching locale has to land on the *translated* URL, not just swap the
 * prefix, or every hreflang pair breaks. `usePathname` from next-intl returns
 * the internal template (e.g. `/services/[slug]`), so passing the same params
 * back through `Link` re-resolves the localised segments.
 *
 * Dynamic slugs are locale-specific too, so pages that own one pass a
 * `slugs` map and we substitute per target locale.
 */
export function LocaleSwitcher({
  slugs,
  className,
  onNavigate,
}: {
  slugs?: Record<Locale, string>;
  className?: string;
  /** Fired on selection, so a container like the mobile drawer can close. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const params = useParams();
  const active = useLocale() as Locale;
  const t = useTranslations("common");
  // Scopes the shared layout animation, so two switchers on one page (header
  // and footer) do not fight over the same pill.
  const groupId = useId();

  return (
    <nav
      aria-label={t("language")}
      className={cn("flex items-center gap-0.5", className)}
    >
      {locales.map((locale) => {
        const isActive = locale === active;
        const nextParams = slugs
          ? { ...params, slug: slugs[locale] }
          : (params as Record<string, string | string[]>);

        return (
          <Link
            key={locale}
            href={{ pathname, params: nextParams } as never}
            locale={locale}
            hrefLang={locale}
            onClick={onNavigate}
            aria-current={isActive ? "true" : undefined}
            title={titles[locale]}
            className={cn(
              "relative rounded-sm px-1.5 py-1 font-mono text-[0.7rem] font-medium tracking-widest transition-colors duration-(--dur-base)",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={`locale-active-${groupId}`}
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-px bg-linear-to-r from-cyan to-violet"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            {labels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
