"use server";

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Resend } from "resend";

import {
  contactSchema,
  type ContactState,
  type ContactValues,
} from "@/lib/contact-schema";
import {
  renderInquiryNotificationEmail,
  renderThankYouEmail,
} from "@/lib/email-templates";
import { site, siteUrl } from "@/lib/site";

/**
 * In-memory rate limit.
 *
 * This resets on every deploy and is per-instance, so it is a speed bump rather
 * than a real control. It is deliberately the only piece that needs replacing
 * when this moves to more than one server - swap the Map for Redis or Vercel KV
 * and nothing else in this file changes.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

/**
 * Built once per cold start, not per submission - the SDK just wraps
 * `fetch`, there is no connection to keep alive.
 *
 * The key is read lazily inside the action rather than at module scope so a
 * missing env var surfaces as a caught, logged delivery failure on the first
 * real submission instead of crashing the whole route at build/import time.
 */
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Sandbox Resend accounts (no verified sending domain yet) can only deliver
 * to the account's own address - `to: site.email` still works, but a real
 * visitor's inbox will bounce. Once a domain is verified in the Resend
 * dashboard, point this at an address on it (e.g. "Druid Forge
 * <hello@druid-forge.hr>") via the env var and both sends start reaching
 * anyone.
 */
const FROM = process.env.RESEND_FROM_EMAIL || "Druid Forge <onboarding@resend.dev>";
const LOGO_URL = `${siteUrl}/brand/druid-forge-768.png`;

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    company: String(formData.get("company") ?? ""),
    service: String(formData.get("service") ?? ""),
    budget: String(formData.get("budget") ?? ""),
    message: String(formData.get("message") ?? ""),
    consent: String(formData.get("consent") ?? ""),
    website: String(formData.get("website") ?? ""),
  };

  /**
   * Sent back with every failure so the form can restore itself. The honeypot
   * is deliberately not included - it must stay empty on a re-render, or a
   * legitimate retry would look like a bot on the second attempt.
   */
  const values: ContactValues = {
    name: raw.name,
    email: raw.email,
    company: raw.company,
    service: raw.service,
    budget: raw.budget,
    message: raw.message,
    consent: raw.consent === "on",
  };

  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      // Keep the first error per field; showing four at once helps nobody.
      if (!errors[field]) errors[field] = issue.message;
    }
    return { status: "error", errors, values };
  }

  // Honeypot tripped. Report success so a bot learns nothing from the response.
  if (parsed.data.website) {
    return { status: "success", email: parsed.data.email };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return { status: "error", formError: "errorRateLimit", values };
  }

  const resend = getResend();
  if (!resend) {
    console.error("[contact] RESEND_API_KEY is not set - enquiry not delivered");
    return { status: "error", formError: "errorGeneric", values };
  }

  const locale = await getLocale();
  const data = parsed.data;

  // Human-readable labels for both emails, resolved once and shared by them -
  // `service`/`budget` are optional, so an empty string is an expected input,
  // not a bug, and `services.items` only has entries for real service ids
  // (never "other"), so that lookup is guarded separately below.
  const ts = await getTranslations({ locale, namespace: "contact" });
  const ti = await getTranslations({ locale, namespace: "services.items" });
  const tsEmail = await getTranslations({
    locale,
    namespace: "contact.confirmationEmail",
  });

  const serviceLabel = !data.service
    ? tsEmail("notSpecified")
    : data.service === "other"
      ? ts("serviceOther")
      : (() => {
          try {
            return ti(`${data.service}.name`);
          } catch {
            return data.service;
          }
        })();
  // "undecided" is a real, selectable budget option, but it lives under the
  // top-level `budgetUndecided` key rather than inside `budgets.*` - the form
  // builds that option's label the same way (see contact-form.tsx). Only a
  // truly empty string (field never touched) falls through to "not specified".
  const budgetLabel = !data.budget
    ? tsEmail("notSpecified")
    : data.budget === "undecided"
      ? ts("budgetUndecided")
      : ts(`budgets.${data.budget}`);

  // -------------------------------------------------------------------
  // 1. Internal notification, to the studio's own inbox. This is the one
  //    that actually matters - if it fails, the enquiry is lost, so its
  //    failure is what the visitor sees reflected back as an error.
  // -------------------------------------------------------------------
  try {
    const notification = renderInquiryNotificationEmail({
      logoUrl: LOGO_URL,
      siteName: site.name,
      name: data.name,
      email: data.email,
      company: data.company ?? "",
      serviceLabel,
      budgetLabel,
      message: data.message,
      locale,
    });

    await resend.emails.send({
      from: FROM,
      to: site.email,
      replyTo: data.email,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
    });
  } catch (error) {
    console.error("[contact] internal notification failed", error);
    return { status: "error", formError: "errorGeneric", values };
  }

  // -------------------------------------------------------------------
  // 2. Client-facing thank-you. Best-effort: the enquiry itself already
  //    landed above, so a bounce here (most likely an unverified sending
  //    domain rejecting delivery to a third party) is logged, not surfaced
  //    to the visitor as a failed submission.
  // -------------------------------------------------------------------
  try {
    const thankYou = renderThankYouEmail({
      logoUrl: LOGO_URL,
      siteName: site.name,
      siteEmail: site.email,
      sitePhone: site.phone,
      addressLine: `${site.address.street}, ${site.address.postalCode} ${site.address.city}`,
      legalLine: `${site.name}, obrt, vl. ${site.owner}`,
      subject: tsEmail("subject", { name: data.name }),
      greeting: tsEmail("greeting", { name: data.name }),
      body: tsEmail("body"),
      recapTitle: tsEmail("recapTitle"),
      recapService: tsEmail("recapService"),
      recapBudget: tsEmail("recapBudget"),
      recapMessage: tsEmail("recapMessage"),
      serviceValue: serviceLabel,
      budgetValue: budgetLabel,
      messageValue: data.message,
      signOff: tsEmail("signOff"),
      signature: tsEmail("signature"),
      footerNote: tsEmail("footerNote"),
    });

    await resend.emails.send({
      from: FROM,
      to: data.email,
      replyTo: site.email,
      subject: thankYou.subject,
      html: thankYou.html,
      text: thankYou.text,
    });
  } catch (error) {
    console.error("[contact] client confirmation failed", error);
  }

  return { status: "success", email: data.email };
}
