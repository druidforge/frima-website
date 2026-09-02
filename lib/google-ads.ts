/**
 * Google Ads conversion tracking.
 *
 * Two values, both from the Ads account and neither of them a secret (they
 * ship to the browser in the tag itself):
 *
 *   NEXT_PUBLIC_GOOGLE_ADS_ID     - the account tag, "AW-0000000000".
 *   NEXT_PUBLIC_GOOGLE_ADS_LABEL  - the conversion action's label, the opaque
 *                                   string after the slash in the event
 *                                   snippet Ads generates for a conversion
 *                                   action (Goals > Conversions > Summary >
 *                                   the action > Tag setup > Install manually).
 *
 * The label is what identifies *which* conversion action a submission counts
 * towards. Without it Ads receives an event it cannot attribute, so this
 * no-ops rather than sending an unattributed hit.
 */
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const ADS_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL;

type GtagFn = (
  command: "event",
  eventName: string,
  params: Record<string, unknown>,
) => void;

/**
 * Reports one contact-form submission as a conversion.
 *
 * Safe to call unconditionally. `window.gtag` only exists once the visitor has
 * accepted the "ads" category and `<GoogleAds>` has loaded the tag, so a
 * visitor who declined simply isn't counted - which is the intended outcome,
 * not a failure.
 */
export function trackContactConversion() {
  if (!ADS_ID || !ADS_LABEL) return;

  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return;

  gtag("event", "conversion", {
    send_to: `${ADS_ID}/${ADS_LABEL}`,
  });
}
