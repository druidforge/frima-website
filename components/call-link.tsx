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
  children,
}: {
  phone: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className={className}
      onClick={() => trackCallConversion()}
    >
      {children}
    </a>
  );
}
