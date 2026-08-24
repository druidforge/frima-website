"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { useId } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { locales, routing, type Locale } from "@/i18n/routing";
import { services } from "@/lib/services";
import { cn } from "@/lib/utils";

const labels: Record<Locale, string> = { hr: "HR", en: "EN", de: "DE" };
const titles: Record<Locale, string> = {
  hr: "Hrvatski",
  en: "English",
  de: "Deutsch",
};

/**
 * Switching locale has to land on the *translated* URL, not just swap the
 * prefix, or every hreflang pair breaks. `Link` re-resolves the localised
 * segments, but only when it is handed a pathname that matches a key in the
 * routing config - see the note on `template` below for why the one
 * `usePathname` returns does not.
 *
 * Dynamic slugs are locale-specific too, so the target locale needs its own
 * slug rather than the current one. A page that owns the slug may pass a
 * `slugs` map; when it does not, we resolve it from the URL instead.
 *
 * That fallback is not a nicety. The header and footer render this switcher on
 * every page, service detail pages included, and neither has any way to know
 * which service is on screen. Without a map the target locale keeps the
 * *current* locale's slug - `/en/services/izrada-web-stranica` - which 404s.
 * Resolving here means every switcher on the page is right, whether or not its
 * parent remembered to hand one over.
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
  const slugParam = typeof params.slug === "string" ? params.slug : undefined;
  const resolvedSlugs =
    slugs ??
    (slugParam
      ? services.find((service) => service.slug[active] === slugParam)?.slug
      : undefined);

  /**
   * `usePathname` is documented as returning the internal template, but with
   * `trailingSlash: true` it hands back the *concrete* path with a slash on
   * the end - `/about/`, `/services/izrada-web-stranica/`. Neither matches a
   * key in `routing.pathnames` (`/about`, `/services/[slug]`), so next-intl
   * finds no mapping, quietly falls back to passing the name through, and the
   * link keeps the untranslated segment: `/de/about/` instead of
   * `/de/ueber-uns/`, and on service pages `/en/services/<croatian-slug>/`,
   * which 404s.
   *
   * So resolve the template ourselves: a page carrying a service slug is the
   * `[slug]` route, anything else is matched by its trimmed path. Anything
   * unrecognised is the catch-all 404, which has no translation - send those
   * to the target locale's home page rather than emit a dead URL.
   */
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const template = resolvedSlugs
    ? "/services/[slug]"
    : Object.prototype.hasOwnProperty.call(routing.pathnames, trimmed)
      ? trimmed
      : "/";
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

        /* Only the params this route declares - spreading `useParams()` would
           also pass `locale`, which is not part of any template. */
        const href = resolvedSlugs
          ? { pathname: template, params: { slug: resolvedSlugs[locale] } }
          : { pathname: template };

        return (
          <Link
            key={locale}
            href={href as never}
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
