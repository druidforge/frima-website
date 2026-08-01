import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { PageHeader } from "@/components/page-header";
import { locales, type Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.contact" });

  return buildMetadata({
    title: t("title"),
    description: t("description"),
    href: "/contact",
    locale,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ContactHeader />
      <ContactBody />
    </>
  );
}

function ContactHeader() {
  const t = useTranslations("contact");
  const tn = useTranslations("nav");
  return (
    <PageHeader
      eyebrow={tn("contact")}
      title={t("title")}
      lead={t("lead")}
      seed={29}
      hue={[36, 24]}
    />
  );
}

function ContactBody() {
  const t = useTranslations("contact");

  // `PageHeader` already contributes pb-16 / md:pb-24, so pt-12 brings the
  // space above this block to 7rem / 9rem - the same air the section leaves
  // beneath it before the footer.
  return (
    <section className="pt-12 pb-28 md:pb-36">
      <div className="shell grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        {/* Source order puts the form first because it is the primary action
            and should lead in the accessibility tree. Stacked on a phone the
            direct details are the faster answer, so `order` moves them above
            visually - and only there; from `lg` the two sit side by side and
            the form returns to the left. */}
        <div className="order-2 lg:order-1">
          <ContactForm />
        </div>

        {/* Sticky from the top of the form to its bottom, so the direct details
            stay reachable while a long form scrolls past. `self-start` is what
            makes it work at all: grid items stretch to the row height by
            default, and a full-height item has nothing left to stick within.
            `top-28` clears the fixed 4.5rem header with room to spare. */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
          <h2 className="eyebrow">{t("directTitle")}</h2>
          <dl className="mt-7 space-y-7">
            <ContactRow icon={<Mail size={16} />} label={t("emailLabel")}>
              <a
                href={`mailto:${site.email}`}
                className="underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
              >
                {site.email}
              </a>
            </ContactRow>
            <ContactRow icon={<Phone size={16} />} label={t("phoneLabel")}>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
              >
                {site.phone}
              </a>
            </ContactRow>
            <ContactRow icon={<MapPin size={16} />} label={t("addressLabel")}>
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
              <br />
              {site.address.countryName}
            </ContactRow>
            <ContactRow icon={<Clock size={16} />} label={t("hoursLabel")}>
              {t("hoursValue")}
            </ContactRow>
          </dl>
        </aside>
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span aria-hidden="true" className="mt-1 shrink-0 text-violet">
        {icon}
      </span>
      <div>
        <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-faint">
          {label}
        </dt>
        <dd className="mt-1.5 leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}
