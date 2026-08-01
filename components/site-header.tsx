"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";

import { ScrollProgress } from "@/components/interactions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { MenuToggleIcon } from "@/components/menu-toggle-icon";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", key: "services" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // The header stays pinned at all times. Scroll position only decides whether
  // it carries its background and border, so it stays legible once content is
  // passing underneath it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("scroll-locked", open);

    /**
     * A backdrop stops pointer events, but it does nothing for the keyboard -
     * every link behind it stays in the tab order, so the focus ring can walk
     * off into a page the visitor cannot see. `inert` removes the whole subtree
     * from hit-testing, focus and the accessibility tree at once, which is what
     * "unclickable" should actually mean.
     */
    const main = document.getElementById("main");
    const footer = document.querySelector("footer");
    main?.toggleAttribute("inert", open);
    footer?.toggleAttribute("inert", open);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKeyDown);

    return () => {
      document.documentElement.classList.remove("scroll-locked");
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* Rendered as a sibling of <header>, not inside it.
          The header carries `backdrop-blur-xl` while open, and `backdrop-filter`
          makes an element a containing block for `position: fixed` descendants -
          exactly like `transform` does. Nested inside, this overlay stopped
          measuring against the viewport and collapsed into the header's own box,
          which is why no overlay appeared at all. Out here it spans the screen,
          sitting under the header's z-50 but above the page. */}
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            aria-label={tc("close")}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-0 bottom-0 top-[4.5rem] z-40 cursor-default bg-ink/30 backdrop-blur-sm md:hidden"
          />
        ) : null}
      </AnimatePresence>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-(--dur-slow) ease-out-quint",
          scrolled || open
            ? "border-b border-border bg-paper/85 backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <div className="shell flex h-[4.5rem] items-center justify-between gap-6">
          <Link
            href="/"
            // The logo navigates like any other link, so it has to dismiss the
            // drawer too - otherwise it stays open over the page it just left.
            onClick={() => setOpen(false)}
            className="group -m-2 rounded-sm p-2 text-foreground"
            aria-label="OKTOPOD"
          >
            <Logo animated />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative rounded-sm px-3 py-2 text-sm transition-colors duration-(--dur-base)",
                    isActive
                      ? "text-foreground"
                      : "text-ink-faint hover:text-foreground",
                  )}
                >
                  {/* Label rides out, its clone rides in. */}
                  <span className="link-swap">
                    <span>{t(link.key)}</span>
                    <span aria-hidden="true">{t(link.key)}</span>
                  </span>
                  {isActive ? (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-px h-px bg-linear-to-r from-cyan to-violet"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <LocaleSwitcher className="hidden sm:flex" />
            <Link
              href="/contact"
              className="btn-ink hidden rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-paper lg:inline-flex"
            >
              {t("startProject")}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="-m-2 rounded-sm p-2 transition-transform duration-(--dur-base) ease-out-quint active:scale-90 md:hidden"
            >
              <span className="sr-only">{open ? tc("close") : tc("menu")}</span>
              {/* One morphing path instead of swapping two icons - no exit
                animation to wait on, so the state change reads as continuous. */}
              <MenuToggleIcon
                open={open}
                aria-hidden="true"
                className="size-6"
              />
            </button>
          </div>
        </div>

        <ScrollProgress />

        <AnimatePresence>
          {open ? (
            <motion.div
              id="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.42, ease: EASE }}
              className="overflow-hidden border-t border-border bg-paper md:hidden"
            >
              <nav aria-label="Primary" className="shell flex flex-col py-4">
                {links.map((link, index) => (
                  <motion.span
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.06 + index * 0.05,
                      ease: EASE,
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-border/60 py-4 font-display text-2xl tracking-tight transition-[padding-left,color] duration-(--dur-base) ease-out-quint hover:pl-2"
                    >
                      {t(link.key)}
                    </Link>
                  </motion.span>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex items-center justify-between pt-5"
                >
                  {/* Switching language navigates, so it dismisses the drawer
                      for the same reason the links do. */}
                  <LocaleSwitcher onNavigate={() => setOpen(false)} />
                  <Link
                    href="/contact"
                    onClick={() => setOpen(false)}
                    className="btn-ink rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-paper"
                  >
                    {t("startProject")}
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>
    </>
  );
}
