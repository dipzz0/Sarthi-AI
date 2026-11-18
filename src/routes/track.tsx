import { createFileRoute } from "@tanstack/react-router";
import { requireAccount } from "@/lib/require-auth";
import {
  Bus,
  CarTaxiFront,
  Clock3,
  Gauge,
  IndianRupee,
  MapPin,
  Radar,
  TrainFront,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppScreen, SectionHeading, TabBar } from "@/components/site-chrome";
import { SERVICES, stationName } from "@/lib/transit-data";

export const Route = createFileRoute("/track")({
  ssr: false,
  beforeLoad: requireAccount,
  head: () => ({
    meta: [
      { title: "Live Tracking — Sarthi AI" },
      {
        name: "description",
        content:
          "Track buses, auto-rickshaws and trains live: current stop, running delay, distance covered and arrival estimate on one screen.",
      },
      { property: "og:title", content: "Live Tracking — Sarthi AI" },
      {
        property: "og:description",
        content: "Live position, delay and arrival estimate for every Sarthi AI service.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

const MODE_ICON = { bus: Bus, auto: CarTaxiFront, train: TrainFront } as const;

function TrackPage() {
  const [selected, setSelected] = useState(SERVICES[0]!.id);
  const [progress, setProgress] = useState(0.34);

  const service = useMemo(() => SERVICES.find((s) => s.id === selected) ?? SERVICES[0]!, [selected]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 0.97 ? 0.05 : p + 0.005));
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  const stops = [
    stationName(service.fromCode),
    service.via.split(" · ")[0] ?? "Mid halt",
    "Junction",
    stationName(service.toCode),
  ];
  const activeIndex = Math.min(stops.length - 1, Math.floor(progress * stops.length));
  const remaining = Math.round(service.durationMin * (1 - progress));

  return (
    <>
      <AppScreen title="Live tracking" subtitle={`${SERVICES.length} services reporting`} back>
        <section className="animate-rise flex flex-col rounded-2xl bg-ink p-5 text-parchment">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <SectionHeading icon={Radar} title="Now running" tone="dark" />
              <div className="font-display mt-3 text-4xl leading-none tracking-tight">
                {service.number}
              </div>
              <p className="mt-1 flex items-center gap-1 font-mono text-xs text-parchment/60">
                <MapPin size={12} />
                {stationName(service.fromCode)} → {stationName(service.toCode)} ·{" "}
                {service.serviceClass}
              </p>
            </div>
            <div className="text-right">
              <span className="flex items-center justify-end gap-1 font-mono text-[10px] tracking-[0.15em] text-gold uppercase">
                <Clock3 size={12} /> Arrives {service.arrival}
              </span>
              <div className="font-display text-3xl tracking-tight text-gold tabular-nums">
                {Math.floor(remaining / 60)}h {remaining % 60}m
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative h-1.5 rounded-full bg-parchment/15">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-gold to-sunset transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
              <span
                className="animate-livepulse absolute -top-1 size-3.5 rounded-full bg-rail transition-[left] duration-1000 ease-linear"
                style={{ left: `calc(${progress * 100}% - 7px)` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {stops.map((stop, i) => (
                <div key={stop + i}>
                  <div
                    className={
                      i <= activeIndex
                        ? "truncate text-sm font-semibold"
                        : "truncate text-sm font-semibold text-parchment/50"
                    }
                  >
                    {stop}
                  </div>
                  <div className="font-mono text-[10px] text-parchment/50">
                    {i < activeIndex ? "Passed" : i === activeIndex ? "Current" : "Upcoming"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Stat icon={Gauge} label="Covered" value={`${Math.round(progress * 100)}%`} />
            <Stat
              icon={Users}
              label="Occupancy"
              value={`${100 - Math.min(95, service.seatsLeft)}%`}
            />
            <Stat icon={IndianRupee} label="Fare from" value={`₹${service.baseFare}`} />
          </div>
        </section>

        <section className="space-y-2">
          <SectionHeading icon={Bus} title="Pick a service" hint="Tap to follow it live" />
          {SERVICES.map((s) => {
            const Icon = MODE_ICON[s.mode];
            const active = s.id === selected;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={
                  active
                    ? "flex w-full items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-left text-parchment"
                    : "flex w-full items-center gap-3 rounded-2xl bg-parchment-2 px-4 py-3 text-left ring-1 ring-black/5 transition-colors hover:bg-parchment"
                }
              >
                <span
                  className={
                    active
                      ? "grid size-9 shrink-0 place-items-center rounded-xl bg-parchment/10 text-gold"
                      : "grid size-9 shrink-0 place-items-center rounded-xl bg-parchment text-sunset ring-1 ring-black/5"
                  }
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display truncate text-base tracking-tight">{s.number}</div>
                  <div
                    className={
                      active
                        ? "truncate font-mono text-[11px] text-parchment/60"
                        : "truncate font-mono text-[11px] text-ink-soft"
                    }
                  >
                    {stationName(s.fromCode)} → {stationName(s.toCode)} · {s.serviceClass}
                  </div>
                </div>
                <span
                  className={
                    s.status === "On time"
                      ? "shrink-0 font-mono text-[10px] text-rail uppercase"
                      : "shrink-0 font-mono text-[10px] text-sunset uppercase"
                  }
                >
                  {s.status}
                </span>
              </button>
            );
          })}
        </section>
      </AppScreen>
      <TabBar />
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-parchment/5 px-4 py-3 ring-1 ring-parchment/10">
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-parchment/50 uppercase">
        <Icon size={12} /> {label}
      </div>
      <div className="font-display text-2xl tracking-tight tabular-nums">{value}</div>
    </div>
  );
}
