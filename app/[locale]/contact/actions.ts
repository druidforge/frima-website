"use server";

import { headers } from "next/headers";

import {
  contactSchema,
  type ContactState,
  type ContactValues,
} from "@/lib/contact-schema";

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

  try {
    // ---------------------------------------------------------------------
    // Delivery stub. This is the single function to replace when an email
    // provider is chosen - everything above (validation, honeypot, rate limit)
    // stays exactly as it is.
    //
    //   await resend.emails.send({
    //     from: "web@druidforge.hr",
    //     to: site.email,
    //     replyTo: parsed.data.email,
    //     subject: `Upit: ${parsed.data.name}`,
    //     text: buildBody(parsed.data),
    //   });
    // ---------------------------------------------------------------------
    console.info("[contact] enquiry received", {
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company || null,
      service: parsed.data.service || null,
      budget: parsed.data.budget || null,
      length: parsed.data.message.length,
      at: new Date().toISOString(),
    });

    return { status: "success", email: parsed.data.email };
  } catch (error) {
    console.error("[contact] delivery failed", error);
    return { status: "error", formError: "errorGeneric", values };
  }
}
