"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowUpRight, Check } from "lucide-react";

import { submitContact } from "@/app/[locale]/contact/actions";
import { FormSelect, type SelectOption } from "@/components/form-select";
import { Link } from "@/i18n/navigation";
import { budgetKeys, type ContactState } from "@/lib/contact-schema";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const initial: ContactState = { status: "idle" };
const EASE = [0.22, 1, 0.36, 1] as const;

export function ContactForm() {
  const t = useTranslations("contact");
  const ti = useTranslations("services.items");
  const [state, action, pending] = useActionState(submitContact, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  // Move focus to the outcome so it is announced instead of silently appearing
  // below the fold.
  useEffect(() => {
    if (state.status !== "idle") alertRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <motion.div
        ref={alertRef}
        tabIndex={-1}
        role="status"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="rounded-md border border-border bg-paper p-9"
      >
        {/* The tick draws itself rather than appearing - a short beat of
            feedback that the submission actually completed. */}
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="flex size-11 items-center justify-center rounded-full bg-violet/12 text-violet"
        >
          <Check size={20} aria-hidden="true" />
        </motion.span>
        <h2 className="mt-6 font-display text-(length:--text-step-2) font-semibold tracking-tight">
          {t("successTitle")}
        </h2>
        <p className="mt-3 text-ink-soft">
          {t("successBody", { email: state.email ?? "" })}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="group mt-8 inline-flex items-center gap-2 border-b border-ink/25 pb-1 text-sm font-medium transition-colors duration-(--dur-base) hover:border-ink"
        >
          {t("successAgain")}
          <ArrowUpRight size={15} aria-hidden="true" className="arrow-travel" />
        </button>
      </motion.div>
    );
  }

  const err = (field: string) => state.errors?.[field];
  // React clears an uncontrolled form once the action resolves, so each field
  // re-seeds its default from what the server echoed back. Without this, one
  // bad email address wipes everything the visitor typed.
  const prev = state.values;

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="rounded-md border border-border bg-paper p-7 md:p-9"
    >
      <h2 className="eyebrow">{t("formTitle")}</h2>

      <AnimatePresence>
        {state.formError ? (
          <motion.div
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex gap-3 overflow-hidden rounded-sm border border-destructive/35 bg-destructive/8 p-4 text-sm"
          >
            <AlertCircle
              size={17}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            <div>
              <strong className="font-medium">{t("errorTitle")}</strong>
              <p className="mt-1 text-ink-soft">
                {t(state.formError, { email: site.email })}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <Field
          id={`${uid}-name`}
          name="name"
          label={t("name")}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          required
          defaultValue={prev?.name}
          error={err("name")}
        />
        <Field
          id={`${uid}-email`}
          name="email"
          type="email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
          defaultValue={prev?.email}
          error={err("email")}
        />
        <Field
          id={`${uid}-company`}
          name="company"
          label={t("company")}
          hint={t("companyOptional")}
          placeholder={t("companyPlaceholder")}
          autoComplete="organization"
          defaultValue={prev?.company}
          error={err("company")}
        />
        <SelectField
          id={`${uid}-service`}
          name="service"
          label={t("service")}
          placeholder={t("servicePlaceholder")}
          defaultValue={prev?.service}
          error={err("service")}
          options={[
            ...services.map((service) => ({
              value: service.id,
              label: ti(`${service.id}.name`),
            })),
            { value: "other", label: t("serviceOther") },
          ]}
        />
        <SelectField
          id={`${uid}-budget`}
          name="budget"
          label={t("budget")}
          placeholder={t("budgetPlaceholder")}
          defaultValue={prev?.budget}
          error={err("budget")}
          className="sm:col-span-2"
          options={[
            ...budgetKeys
              .filter((key) => key !== "undecided")
              .map((key) => ({ value: key, label: t(`budgets.${key}`) })),
            { value: "undecided", label: t("budgetUndecided") },
          ]}
        />
      </div>

      <div className="mt-6">
        <Label htmlFor={`${uid}-message`} required>
          {t("message")}
        </Label>
        <textarea
          id={`${uid}-message`}
          name="message"
          rows={6}
          required
          placeholder={t("messagePlaceholder")}
          defaultValue={prev?.message}
          aria-invalid={err("message") ? true : undefined}
          aria-describedby={err("message") ? `${uid}-message-err` : undefined}
          className={cn(inputClass, "mt-2 resize-y")}
        />
        <FieldError id={`${uid}-message-err`} error={err("message")} />
      </div>

      {/* Honeypot. Hidden from sight and from assistive tech, but a bot that
          fills every input will trip it. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="mt-7">
        <label className="flex cursor-pointer gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            name="consent"
            required
            defaultChecked={prev?.consent}
            aria-invalid={err("consent") ? true : undefined}
            aria-describedby={err("consent") ? `${uid}-consent-err` : undefined}
            className="mt-1 size-4 shrink-0 accent-violet"
          />
          <span className="text-ink-soft">
            {t.rich("consent", {
              link: (chunks) => (
                <Link
                  href="/privacy"
                  className="text-ink underline decoration-ink/30 underline-offset-4 transition-[text-decoration-color] duration-(--dur-base) ease-out-quint hover:decoration-ink"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        <FieldError id={`${uid}-consent-err`} error={err("consent")} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-ink group mt-8 inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3.5 font-medium text-paper disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
        {pending ? (
          // Three cells pulsing in sequence, echoing the chromatophore field.
          <span aria-hidden="true" className="ml-0.5 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1 rounded-full bg-paper"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.16,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        ) : (
          <ArrowUpRight size={17} aria-hidden="true" className="arrow-travel" />
        )}
      </button>
    </form>
  );
}

/* Placeholder fades back as the field takes focus, so the label and the value
   are what the eye lands on rather than three competing greys. */
const inputClass =
  "w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-[0.95rem] caret-ink outline-none transition-[border-color,background-color,box-shadow] duration-(--dur-base) ease-out-quint placeholder:text-ink-faint/70 placeholder:transition-opacity placeholder:duration-(--dur-base) focus:placeholder:opacity-40 focus-visible:border-violet aria-[invalid=true]:border-destructive";

function Label({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-baseline gap-2 text-sm font-medium"
    >
      {children}
      {hint ? (
        <span className="font-mono text-[0.68rem] font-normal text-ink-faint">
          {hint}
        </span>
      ) : null}
      {required ? (
        <span aria-hidden="true" className="text-violet">
          *
        </span>
      ) : null}
    </label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  const t = useTranslations("contact.validation");

  return (
    <AnimatePresence>
      {error ? (
        <motion.p
          id={id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="mt-2 flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle size={14} aria-hidden="true" />
          {t(error)}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  id,
  name,
  label,
  error,
  hint,
  required,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label htmlFor={id} hint={hint} required={required}>
        {label}
      </Label>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(inputClass, "mt-2")}
        {...rest}
      />
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  placeholder,
  options,
  defaultValue,
  error,
  className,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
  defaultValue?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">
        <FormSelect
          id={id}
          name={name}
          placeholder={placeholder}
          options={options}
          defaultValue={defaultValue}
          invalid={Boolean(error)}
          describedBy={error ? `${id}-err` : undefined}
        />
      </div>
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}
