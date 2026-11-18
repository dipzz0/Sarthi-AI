import { ArrowRight, Clock, IndianRupee, Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { JourneyPlan } from "@/lib/journey";

export function JourneyPlanCard({
  plan,
  action,
}: {
  plan: JourneyPlan;
  action?: React.ReactNode;
}) {
  return (
    <article className="surface-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="secondary">{plan.label}</Badge>
          <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">
            {plan.origin} <ArrowRight className="inline h-4 w-4 text-muted-foreground" />{" "}
            {plan.destination}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{plan.modeSummary}</p>
        </div>
        {action}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" /> {plan.totalMinutes} min
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IndianRupee className="h-4 w-4 text-primary" /> {plan.totalFare}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Repeat className="h-4 w-4 text-primary" /> {plan.transfers} change
          {plan.transfers === 1 ? "" : "s"}
        </span>
      </div>

      <ol className="mt-5 space-y-4 border-l border-border pl-5">
        {plan.legs.map((leg, i) => (
          <li key={`${leg.lineId}-${i}`} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <p className="text-sm font-medium">
              {leg.from} → {leg.to}
            </p>
            <p className="text-xs text-muted-foreground">
              {leg.lineName} · {leg.modeLabel} · {leg.operator}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {leg.minutes} min · ₹{leg.fare} · every {leg.headway} · {leg.serviceWindow}
            </p>
            {leg.note ? <p className="mt-1 text-xs text-accent">{leg.note}</p> : null}
          </li>
        ))}
      </ol>

      {plan.tips.length > 0 && (
        <ul className="mt-5 space-y-1.5 rounded-xl bg-secondary/60 p-4 text-xs text-muted-foreground">
          {plan.tips.map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
