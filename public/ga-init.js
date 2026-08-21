/**
 * GA4 bootstrap, as a same-origin static file rather than an inline <script>.
 *
 * The CSP in `next.config.ts` doesn't grant `script-src` an `'unsafe-inline'`
 * exception, so an inline init block would be silently blocked. Reads its own
 * measurement ID off its own <script src> query string instead of having one
 * baked in, so this file stays generic - `components/google-analytics.tsx` is
 * what supplies the id, same as it supplies it to the gtag.js loader tag.
 */
(function () {
  var id = new URL(document.currentScript.src).searchParams.get("id");
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", id);
})();
