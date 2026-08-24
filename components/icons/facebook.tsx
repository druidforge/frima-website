/**
 * Same reasoning as `instagram.tsx`: lucide dropped the brand icons, and the
 * contact page and footer are otherwise all lucide, so this is drawn to that
 * exact set - 24x24, `currentColor` stroke, rounded caps/joins, same default
 * weight. The standard simplified "f" glyph, nothing custom.
 */
export function FacebookIcon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
