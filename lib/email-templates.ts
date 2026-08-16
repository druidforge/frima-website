/**
 * Hand-written HTML email templates, not React-rendered.
 *
 * Email clients are not browsers: no external stylesheet, no flexbox/grid in
 * Outlook, no custom webfont loading worth relying on. So this is deliberately
 * the plainest thing that still looks branded - a table-based shell (header,
 * a two-cell colour bar standing in for the site's cyan -> violet gradient,
 * body, footer) shared by both emails this site sends, with a system font
 * stack instead of Bricolage/Instrument, which would just fall back silently
 * in most inboxes anyway.
 */

const INK = "#16131d";
const INK_SOFT = "#6d6579";
const PAPER = "#f5f4f0";
const BORDER = "#e0ddd5";
const CYAN = "#07ebee";
const VIOLET = "#954cfb";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Never trust visitor-submitted text with raw HTML, even addressed to our own inbox. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** `\n` in a textarea has to become a real line break - the shell has no
 *  `white-space: pre-wrap` to fall back on the way a browser would. */
function escapeMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

type ShellOptions = {
  logoUrl: string;
  siteName: string;
  previewText: string;
  bodyHtml: string;
  footerHtml: string;
};

/**
 * Shared chrome for every email this site sends. `previewText` is the
 * inbox-list preview line most clients show next to the subject - hidden in
 * the body itself (zero size, clipped) rather than left to whatever text the
 * client happens to grab first, which is usually "view this in your browser".
 */
function emailShell({
  logoUrl,
  siteName,
  previewText,
  bodyHtml,
  footerHtml,
}: ShellOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(siteName)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${PAPER}; font-family:${FONT_STACK};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapeHtml(previewText)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:10px; overflow:hidden; border:1px solid ${BORDER};">
            <tr>
              <td style="background-color:${INK}; padding:26px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logoUrl}" width="28" height="28" alt="" style="display:block; border-radius:6px;">
                    </td>
                    <td style="vertical-align:middle; padding-left:12px; font-size:15px; font-weight:700; letter-spacing:0.14em; color:#ffffff;">
                      ${escapeHtml(siteName.toUpperCase())}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="line-height:0; font-size:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="background-color:${CYAN}; height:4px; line-height:4px; font-size:4px;">&nbsp;</td>
                    <td width="50%" style="background-color:${VIOLET}; height:4px; line-height:4px; font-size:4px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px; color:${INK}; font-size:16px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px; border-top:1px solid ${BORDER}; color:${INK_SOFT}; font-size:12.5px; line-height:1.6;">
                ${footerHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function recapRow(label: string, value: string, isLast: boolean) {
  return `<tr>
    <td style="padding:10px 0; ${isLast ? "" : `border-bottom:1px solid ${BORDER};`} font-size:12px; font-family:monospace; text-transform:uppercase; letter-spacing:0.06em; color:${INK_SOFT}; vertical-align:top; width:100px;">
      ${escapeHtml(label)}
    </td>
    <td style="padding:10px 0; ${isLast ? "" : `border-bottom:1px solid ${BORDER};`} font-size:14.5px; color:${INK}; vertical-align:top;">
      ${value}
    </td>
  </tr>`;
}

/**
 * The client-facing confirmation. Warm, brief, and it hands their own
 * message back to them - partly courtesy, partly a paper trail: if a detail
 * gets garbled between the form and our inbox, this is what shows it.
 */
export function renderThankYouEmail({
  logoUrl,
  siteName,
  siteEmail,
  sitePhone,
  addressLine,
  legalLine,
  subject,
  greeting,
  body,
  recapTitle,
  recapService,
  recapBudget,
  recapMessage,
  serviceValue,
  budgetValue,
  messageValue,
  signOff,
  signature,
  footerNote,
}: {
  logoUrl: string;
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  addressLine: string;
  legalLine: string;
  subject: string;
  greeting: string;
  body: string;
  recapTitle: string;
  recapService: string;
  recapBudget: string;
  recapMessage: string;
  serviceValue: string;
  budgetValue: string;
  messageValue: string;
  signOff: string;
  signature: string;
  footerNote: string;
}) {
  const bodyHtml = `
    <p style="margin:0 0 20px; font-size:20px; font-weight:700; letter-spacing:-0.01em;">
      ${escapeHtml(greeting)}
    </p>
    <p style="margin:0 0 28px; color:${INK_SOFT};">
      ${escapeHtml(body)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER}; border:1px solid ${BORDER}; border-radius:8px; margin-bottom:28px;">
      <tr>
        <td style="padding:18px 20px 4px; font-size:11px; font-family:monospace; text-transform:uppercase; letter-spacing:0.1em; color:${INK_SOFT};">
          ${escapeHtml(recapTitle)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${recapRow(recapService, escapeHtml(serviceValue), false)}
            ${recapRow(recapBudget, escapeHtml(budgetValue), false)}
            ${recapRow(recapMessage, escapeMultiline(messageValue), true)}
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;">
      ${escapeHtml(signOff)}<br>
      <strong>${escapeHtml(signature)}</strong>
    </p>`;

  const footerHtml = `
    <p style="margin:0 0 12px;">${escapeHtml(footerNote)}</p>
    <p style="margin:0;">
      ${escapeHtml(siteEmail)} · ${escapeHtml(sitePhone)}<br>
      ${escapeHtml(addressLine)}
    </p>
    <p style="margin:12px 0 0; color:#a39cae;">${escapeHtml(legalLine)}</p>`;

  return {
    subject,
    html: emailShell({
      logoUrl,
      siteName,
      previewText: body,
      bodyHtml,
      footerHtml,
    }),
    text: [
      greeting,
      "",
      body,
      "",
      recapTitle,
      `${recapService}: ${serviceValue}`,
      `${recapBudget}: ${budgetValue}`,
      `${recapMessage}: ${messageValue}`,
      "",
      signOff,
      signature,
    ].join("\n"),
  };
}

/**
 * The internal notification, to the studio's own inbox. Utilitarian rather
 * than warm - this is a work item, not a greeting - but `replyTo` on the
 * send call (not built here) is what actually matters: it makes "Reply" in
 * the studio's mail client go straight to the visitor, skipping this
 * address entirely.
 */
export function renderInquiryNotificationEmail({
  logoUrl,
  siteName,
  name,
  email,
  company,
  serviceLabel,
  budgetLabel,
  message,
  locale,
}: {
  logoUrl: string;
  siteName: string;
  name: string;
  email: string;
  company: string;
  serviceLabel: string;
  budgetLabel: string;
  message: string;
  locale: string;
}) {
  const rows = [
    ["Name", escapeHtml(name)],
    ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:${INK};">${escapeHtml(email)}</a>`],
    ...(company ? [["Company", escapeHtml(company)]] : []),
    ["Service", escapeHtml(serviceLabel)],
    ["Budget", escapeHtml(budgetLabel)],
    ["Locale", locale.toUpperCase()],
  ];

  const bodyHtml = `
    <p style="margin:0 0 24px; font-size:20px; font-weight:700; letter-spacing:-0.01em;">
      New enquiry from ${escapeHtml(name)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${rows.map(([label, value], i) => recapRow(label, value, i === rows.length - 1)).join("")}
    </table>
    <p style="margin:0 0 8px; font-size:11px; font-family:monospace; text-transform:uppercase; letter-spacing:0.1em; color:${INK_SOFT};">
      Message
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER}; border:1px solid ${BORDER}; border-radius:8px;">
      <tr>
        <td style="padding:16px 18px; color:${INK};">${escapeMultiline(message)}</td>
      </tr>
    </table>`;

  const footerHtml = `<p style="margin:0;">Sent automatically from the ${escapeHtml(siteName)} contact form. Reply to this email to write back to ${escapeHtml(name)} directly.</p>`;

  return {
    subject: `New enquiry from ${name}${company ? ` (${company})` : ""}`,
    html: emailShell({
      logoUrl,
      siteName,
      previewText: `${name} - ${serviceLabel} - ${message.slice(0, 100)}`,
      bodyHtml,
      footerHtml,
    }),
    text: [
      `New enquiry from ${name}`,
      "",
      ...rows.map(([label, value]) => `${label}: ${value.replace(/<[^>]+>/g, "")}`),
      "",
      "Message:",
      message,
    ].join("\n"),
  };
}
