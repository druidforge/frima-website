import { useTranslations } from "next-intl";

import { ProcessTimeline, type ProcessStep } from "@/components/process-timeline";
import { Reveal } from "@/components/motion-primitives";

/**
 * How a given service runs, start to finish, as a connected timeline.
 *
 * Steps are per service and every one must be something the studio actually
 * does - they come from the price book and the service's own inclusions, not
 * from a generic agency process.
 *
 * Stays a Server Component and passes the steps down as props:
 * `services.items.*.process` is stripped from the client messages in
 * `app/[locale]/layout.tsx`, so the client timeline could not read it itself.
 */
export function ServiceProcess({ serviceId }: { serviceId: string }) {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");
  const steps = ti.raw(`${serviceId}.process`) as ProcessStep[];

  return (
    <section className="pb-20 md:pb-28">
      <div className="shell">
        <Reveal>
          <h2 className="eyebrow">{t("processTitle")}</h2>
        </Reveal>
        <ProcessTimeline steps={steps} />
      </div>
    </section>
  );
}
