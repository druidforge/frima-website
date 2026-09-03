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
 * This is the event snippet Google Ads generates for the conversion action,
 * minus the parts that do not apply here. Google's version wraps the call in
 * `gtag_report_conversion(url)` with an `event_callback` that assigns
 * `window.location` - machinery whose only job is to hold a navigation open
 * long enough for the ping to leave, for the case where the conversion is a
 * click on a link that immediately unloads the page. This form never
 * navigates: the submission is a server action and the page swaps to its
 * success state in place, so there is nothing to delay and no callback to
 * wait for. Dropping it removes a redirect that would otherwise fire on every
 * successful submission.
 *
 * Safe to call unconditionally, but no longer because `window.gtag` might be
 * missing - since Consent Mode v2 the tag loads for every visitor and `gtag`
 * always exists. The event now always fires and Google applies the visitor's
 * consent state to it: granted means a fully attributed conversion, denied
 * means a cookieless ping that feeds conversion modelling. A visitor who
 * declined is therefore no longer simply uncounted, which is the point of the
 * change. The guard below is left as a defence against being called before
 * the bootstrap has run at all.
 */
export function trackContactConversion() {
  if (!ADS_ID || !ADS_LABEL) return;

  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return;

  gtag("event", "conversion", {
    send_to: `${ADS_ID}/${ADS_LABEL}`,
  });
}
