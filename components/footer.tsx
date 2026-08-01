import { getLocale, getTranslations } from "next-intl/server";

import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const ts = await getTranslations("services.items");

  return (
    <footer className="on-abyss relative mt-px overflow-clip">
      <div className="shell py-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
            <LocaleSwitcher className="mt-6 -ml-1.5" />
          </div>

          <FooterColumn title={t("servicesTitle")}>
            {services.map((service) => (
              <FooterLink
                key={service.id}
                href={{
                  pathname: "/services/[slug]",
                  params: { slug: service.slug[locale] },
                }}
              >
                {ts(`${service.id}.name`)}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={t("studioTitle")}>
            <FooterLink href="/about">{tn("about")}</FooterLink>
            <FooterLink href="/contact">{tn("contact")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("contactTitle")}>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="link-sweep text-sm text-muted-foreground transition-colors duration-(--dur-base) hover:text-foreground"
              >
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="link-sweep text-sm text-muted-foreground transition-colors duration-(--dur-base) hover:text-foreground"
              >
                {site.phone}
              </a>
            </li>
            <li className="text-sm leading-relaxed text-muted-foreground">
              {site.address.street}
              <br />
              {site.address.postalCode} {site.address.city}
              <br />
              {site.address.countryName}
            </li>
          </FooterColumn>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. {t("rights")}{" "}
            <span className="whitespace-nowrap">
              {t("oib")} {site.oib}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/privacy"
              className="link-sweep transition-colors duration-(--dur-base) hover:text-foreground"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/cookies"
              className="link-sweep transition-colors duration-(--dur-base) hover:text-foreground"
            >
              {t("cookies")}
            </Link>
            <CookieSettingsButton className="link-sweep transition-colors duration-(--dur-base) hover:text-foreground">
              {t("cookieSettings")}
            </CookieSettingsButton>
            <span className="font-mono tracking-wider">{t("madeIn")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="eyebrow">{title}</h2>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: React.ComponentProps<typeof Link>["href"];
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-(--dur-base) hover:text-foreground"
      >
        {/* Marker slides out from behind the label, and the label follows. */}
        <span
          aria-hidden="true"
          className="h-px w-0 bg-linear-to-r from-cyan to-violet transition-[width] duration-(--dur-base) ease-out-quint group-hover:w-3"
        />
        <span className="transition-transform duration-(--dur-base) ease-out-quint group-hover:translate-x-0">
          {children}
        </span>
      </Link>
    </li>
  );
}
