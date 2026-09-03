/**
 * Google Consent Mode v2 signals.
 *
 * The defaults - everything non-essential denied - normally arrive from
 * `public/gtag-bootstrap.js`, which `next/script` injects into the initial
 * HTML. They are re-established here for the same reason `gtag-init.js`
 * re-establishes them: `beforeInteractive` guarantees that a script is
 * *fetched* before any first-party code, but Next's own documentation is
 * explicit that its execution does not block hydration. Nothing in that
 * ordering is worth betting compliance on, and the cost of not betting is a
 * guard.
 *
 * So all three call sites set the defaults behind the same `if (!window.gtag)`
 * test. Exactly one of them wins, whichever runs first, and because creating
 * `gtag` and pushing the defaults happen together in that branch, no `config`
 * or `consent update` can reach `dataLayer` ahead of them. Absent a `consent
 * default` command gtag.js does not wait for an answer - it assumes consent
 * and starts writing cookies - so this ordering is the whole mechanism, not a
 * detail of it.
 */

type ConsentState = "granted" | "denied";

export type ConsentSignal =
  | "ad_storage"
  | "ad_user_data"
  | "ad_personalization"
  | "analytics_storage";

export type ConsentSignals = Partial<Record<ConsentSignal, ConsentState>>;

type Gtag = (...args: unknown[]) => void;

interface GtagWindow {
  dataLayer?: unknown[];
  gtag?: Gtag;
}

const DENIED: Record<ConsentSignal, ConsentState> = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

function ensureGtag(): Gtag {
  const w = window as unknown as GtagWindow;
  const dataLayer = (w.dataLayer = w.dataLayer ?? []);

  if (!w.gtag) {
    w.gtag = function gtag() {
      // gtag.js reads its commands off `dataLayer` as `arguments` objects,
      // which is why this is not a rest parameter.
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };

    w.gtag("consent", "default", DENIED);
    w.gtag("set", "ads_data_redaction", true);
    w.gtag("set", "url_passthrough", true);
    w.gtag("js", new Date());
  }

  return w.gtag;
}

/**
 * Sends one `consent update` - the visitor's actual answer for one category.
 *
 * Updates are merged by gtag rather than replacing the previous state, which
 * is why `<GoogleAnalytics>` and `<GoogleAds>` can each send only the signals
 * belonging to their own cookie category without clobbering the other's.
 */
export function updateConsent(signals: ConsentSignals) {
  ensureGtag()("consent", "update", signals);
}

/** Maps a single category's accept/decline onto its signal value. */
export function consentState(granted: boolean): ConsentState {
  return granted ? "granted" : "denied";
}
