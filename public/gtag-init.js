/**
 * Per-tag `config`, as a same-origin static file rather than an inline
 * <script>.
 *
 * Shared by `components/google-analytics.tsx` (GA4) and
 * `components/google-ads.tsx` (Google Ads conversion tracking). Reads the
 * property/account id off its own <script src> query string instead of having
 * one baked in, so this file stays generic - the components supply the id,
 * same as they supply it to the gtag.js loader tag.
 *
 * Both tags share one `dataLayer` and one `gtag()`, which is how gtag.js is
 * designed to carry several products at once. `public/gtag-bootstrap.js` has
 * normally created both and set the Consent Mode v2 defaults by the time this
 * runs - it loads `beforeInteractive`, this one `afterInteractive`.
 *
 * The branch below covers the case where that file did not load at all, and it
 * repeats the denied defaults rather than only defining the stub. Absent any
 * `consent default` command gtag.js does not treat consent as unresolved - it
 * behaves as though everything were granted and starts writing cookies, so
 * "the bootstrap is missing" has to fail closed here or a failed request
 * silently becomes a tag that ignores the banner.
 */
(function () {
  var id = new URL(document.currentScript.src).searchParams.get("id");
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      dataLayer.push(arguments);
    };
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    window.gtag("set", "ads_data_redaction", true);
    window.gtag("set", "url_passthrough", true);
    window.gtag("js", new Date());
  }

  window.gtag("config", id);
})();
