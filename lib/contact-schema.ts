import { z } from "zod";

import { services } from "@/lib/services";

export const budgetKeys = [
  "under1k",
  "1kTo5k",
  "5kTo15k",
  "over15k",
  "undecided",
] as const;

const serviceIds = services.map((service) => service.id);

/**
 * Validation messages are message *keys*, not sentences. The action runs on the
 * server where the visitor's locale is known only from the route, so the client
 * resolves each key through next-intl and the same schema serves all three
 * languages.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "nameShort" })
    .max(120, { message: "nameLong" }),
  email: z.string().trim().email({ message: "emailInvalid" }).max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  service: z
    .string()
    .refine((v) => v === "other" || serviceIds.includes(v), {
      message: "serviceInvalid",
    })
    .optional()
    .or(z.literal("")),
  budget: z.enum(budgetKeys).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(12, { message: "messageShort" })
    .max(2000, { message: "messageLong" }),
  consent: z.literal("on", { message: "consentRequired" }),
  /** Honeypot. Real people never fill a hidden field. */
  website: z.literal("").optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Everything the visitor typed, echoed back so a rejected form keeps it. */
export type ContactValues = {
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  consent: boolean;
};

export type ContactState = {
  status: "idle" | "success" | "error";
  /** Field name -> message key. */
  errors?: Record<string, string>;
  /** Message key for a form-level failure. */
  formError?: "errorGeneric" | "errorRateLimit";
  email?: string;
  /**
   * React resets an uncontrolled form once its action resolves, so without
   * sending the submitted values back every field empties itself the moment one
   * of them fails validation - the visitor retypes everything to fix a typo in
   * one field. The form re-seeds its defaults from this.
   */
  values?: ContactValues;
};
