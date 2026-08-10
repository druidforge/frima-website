"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { services } from "@/lib/services";

/**
 * Warms every route in the site, in the background, once the page is idle.
 *
 * `<Link>` already prefetches, but only once a link scrolls into the viewport.
 * That covers the header nav and little else: the footer carries links to all
 * six service pages plus the legal pages, and the footer is by definition the
 * last thing anyone sees. So the routes a visitor was most likely to reach next
 * were precisely the ones still being fetched at the moment they clicked.
 *
 * Every route here is prerendered - the build output is `●` (SSG) across the
 * board - which means a prefetch pulls the complete route, data included, and
 * a subsequent navigation needs no server round trip at all. There is no
 * `loading.js` anywhere, so none of these are partial prefetches.
 *
 * The whole site is twelve routes per locale of static payload. Fetching that
 * up front is a rounding error next to the photography already on the page, and
 * it is what makes every navigation after the first one instant.
 *
 * Ordering is deliberate: the primary nav first, then the service pages behind
 * it, then the legal pages almost nobody opens. Prefetches are issued one at a
 * time on idle callbacks so they queue behind anything the current page still
 * wants, rather than competing with it.
 */

/** Survives navigations, so the queue is only ever worked through once. */
const warmed = new Set<string>();

export function RoutePrefetcher() {
  const router = useRouter();
  const locale = useLocale() as Locale;

  useEffect(() => {
    /**
     * Production only, for the same reason Next.js disables viewport
     * prefetching there ("it requires compiling the target page").
     *
     * A prefetch in dev is not a cheap fetch of something already built - it
     * asks the dev server to compile that route on the spot. Warming twelve of
     * them puts twelve compilations in front of the one the visitor actually
     * clicked, so the feature that exists to make navigation instant makes it
     * markedly worse in the only environment where you would notice.
     *
     * `next dev` is not a useful place to judge navigation speed regardless:
     * routes compile on first visit and no prefetching happens at all. Compare
     * `next build && next start` instead.
     */
    if (process.env.NODE_ENV !== "production") return;

    /**
     * Honour the two signals a visitor can give that background traffic is
     * unwelcome. Data Saver is an explicit request; an effective 2G estimate is
     * a connection where twelve speculative payloads would actively get in the
     * way of the page being read right now.
     */
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (
      connection?.saveData ||
      (connection?.effectiveType && /2g/.test(connection.effectiveType))
    ) {
      return;
    }

    const targets = [
      "/services",
      "/contact",
      "/about",
      "/",
      ...services.map((service) => ({
        pathname: "/services/[slug]" as const,
        params: { slug: service.slug[locale] },
      })),
      "/privacy",
      "/cookies",
    ] as const;

    const queue = targets.filter((href) => {
      const key = `${locale}:${typeof href === "string" ? href : href.params.slug}`;
      if (warmed.has(key)) return false;
      warmed.add(key);
      return true;
    });

    if (queue.length === 0) return;

    let index = 0;
    let cancel: (() => void) | null = null;
    let cancelled = false;

    const step = () => {
      if (cancelled || index >= queue.length) return;
      // next-intl resolves the localised pathname - `/usluge`, `/leistungen` -
      // from the same href shape `<Link>` takes, so these land on exactly the
      // cache entries the links will later ask for.
      router.prefetch(queue[index++]);
      schedule();
    };

    const schedule = () => {
      if (typeof requestIdleCallback === "function") {
        const id = requestIdleCallback(step, { timeout: 2000 });
        cancel = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(step, 300);
        cancel = () => clearTimeout(id);
      }
    };

    schedule();

    return () => {
      cancelled = true;
      cancel?.();
    };
  }, [router, locale]);

  return null;
}
