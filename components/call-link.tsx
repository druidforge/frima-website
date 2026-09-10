"use client";

import { trackCallConversion } from "@/lib/google-ads";

/**
 * A phone link that reports the click as a Google Ads "Click to call"
 * conversion.
 *
 * The four `tel:` links on the site sit in Server Components (the footer and
 * the contact page), which cannot carry an `onClick`. Rather than turn either
 * of those into a Client Component - the footer in particular renders on every
 * page - this is the smallest possible client boundary: one anchor.
 *
 * It also owns the `tel:` formatting. The href has to be stripped of the
 * spaces that make `site.phone` readable, and that `replace` was previously
 * repeated at all four call sites.
 *
 * The click is not intercepted: no `preventDefault`, no return value. The
 * conversion is reported and the browser goes on to open the dialer exactly
 * as it would have.
 */
export function CallLink({
  phone,
  className,
  onClick,
  children,
}: {
  phone: string;
  className?: string;
  /**
   * Runs after the conversion is reported. The header drawer uses it to close
   * itself, the same way its ordinary links do - without it, returning from
   * the dialer lands the visitor back on an open menu.
   *
   * Only a Client Component may pass this. The footer and the contact page
   * render `CallLink` from the server, where a function prop does not
   * serialise across the boundary - they pass `phone` and `children` alone,
   * which is why this stays optional rather than becoming part of the shape
   * every caller has to satisfy.
   */
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className={className}
      onClick={() => {
        trackCallConversion();
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
