import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAccount } from "@/lib/require-auth";
import {
  ArrowRight,
  BedDouble,
  Compass,
  LifeBuoy,
  Route as RouteIcon,
  Sparkle,
  ArrowRightLeft,
  Bus,
  CarTaxiFront,
  Clock3,
  IndianRupee,
  MapPin,
  Minus,
  Plus,
  Radar,
  ShieldAlert,
  Ticket,
  TrainFront,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppScreen, SectionHeading, TabBar } from "@/components/site-chrome";
import { TicketPass } from "@/components/ticket-pass";
import {
  MODES,
  SERVICES,
  STATIONS,
  TRACK_STOPS,
  calcFare,
  stationName,
  type ModeId,
} from "@/lib/transit-data";
import { addBooking, cancelBooking, makeId, nowLabel, useTransitState } from "@/lib/transit-store";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: requireAccount,
  head: () => ({
    meta: [
      { title: "Sarthi AI — Book Buses, Autos & Trains" },
      {
        name: "description",
        content:
          "Search fares and book buses, auto-rickshaws, local, express, MEMU, shuttle and mail trains. Live tracking, complaints and emergency help in one app.",
      },
      { property: "og:title", content: "Sarthi AI — Book Buses, Autos & Trains" },
      {
        property: "og:description",
        content:
          "One app for fares, booking, live tracking, complaints and emergency help across buses, autos and trains.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const CONCESSIONS = [
  { id: "none", label: "General" },
  { id: "student", label: "Student" },
  { id: "senior", label: "Senior" },
  { id: "child", label: "Child" },
];

const MODE_ICON = { bus: Bus, auto: CarTaxiFront, train: TrainFront } as const;

const AI_LINKS = [
  { to: "/assistant", label: "Assistant", icon: Sparkle },
  { to: "/plan", label: "Journeys", icon: RouteIcon },
  { to: "/stays", label: "Stays", icon: BedDouble },
  { to: "/guide", label: "Guide me", icon: Compass },
  { to: "/file-complaint", label: "AI report", icon: LifeBuoy },
] as const;

function Home() {
  const { bookings } = useTransitState();
  const [mode, setMode] = useState<ModeId>("bus");
  const [from, setFrom] = useState("NDLS");
  const [to, setTo] = useState("JP");
  const [passengers, setPassengers] = useState(1);
  const [concession, setConcession] = useState("none");
  const [passenger, setPassenger] = useState("");

  const results = useMemo(
    () =>
      SERVICES.filter((s) => s.mode === mode && (s.fromCode === from || s.toCode === to)).sort(
        (a, b) => a.baseFare - b.baseFare,
      ),
    [mode, from, to],
  );

  const headline = results[0];
  const headlineFare = headline ? calcFare(headline, passengers, concession) : 0;

  const latest = bookings[0];
  const latestService = latest ? SERVICES.find((s) => s.id === latest.serviceId) : undefined;

  function book(serviceId: string) {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) return;
    addBooking({
      id: makeId("BK"),
      pnr: `SARTHI-${Math.floor(10000 + Math.random() * 89999)}`,
      serviceId,
      passenger: passenger.trim() || "Guest traveller",
      seat:
        service.mode === "auto"
          ? "Ride"
          : `Coach A${1 + (results.length % 4)} · Seat ${8 + results.length}`,
      fare: calcFare(service, passengers, concession),
      bookedAt: nowLabel(),
    });
  }

  return (
    <>
      <AppScreen title="Sarthi AI">
        {/* AI companion entry points */}
        <section className="rounded-2xl bg-ink p-4 text-parchment shadow-panel">
          <div className="font-mono text-[10px] tracking-[0.25em] text-gold uppercase">
            Sarthi AI companion
          </div>
          <p className="mt-1 text-sm text-parchment/70">
            Chat, plan a full journey, find a stay, or get unstuck anywhere in Mumbai.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {AI_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-parchment/10 px-2 py-3 text-center transition-colors hover:bg-parchment/20 active:scale-95"
              >
                <l.icon size={18} className="text-gold" />
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase">{l.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Mode switch */}
        <section className="grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const Icon = MODE_ICON[m.id];
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={
                  active
                    ? "flex flex-col items-center gap-1 rounded-2xl bg-ink px-3 py-4 text-parchment shadow-panel transition-transform active:scale-95"
                    : "flex flex-col items-center gap-1 rounded-2xl bg-parchment-2 px-3 py-4 text-ink-soft ring-1 ring-black/5 transition-transform hover:text-ink active:scale-95"
                }
              >
                <Icon size={22} className={active ? "text-gold" : ""} />
                <span className="text-sm font-semibold">{m.label}</span>
                <span
                  className={
                    active
                      ? "font-mono text-[9px] tracking-wider text-parchment/50 uppercase"
                      : "font-mono text-[9px] tracking-wider uppercase"
                  }
                >
                  {m.blurb}
                </span>
              </button>
            );
          })}
        </section>

        {/* Search card */}
        <section className="board-surface animate-rise space-y-4 rounded-2xl p-4 sm:p-6">
          <SectionHeading icon={MapPin} title="Route" hint="Pick pickup and drop point" />

          <div className="grid items-end gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                From
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-xl bg-parchment px-3 py-3 ring-1 ring-black/5">
                <MapPin size={16} className="shrink-0 text-rail" />
                <div className="min-w-0 flex-1">
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="font-display w-full bg-transparent text-xl tracking-tight outline-none"
                  >
                    {STATIONS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="font-mono text-[10px] tracking-wider text-ink-soft">{from}</div>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2 sm:flex sm:items-center sm:justify-center sm:pb-4">
              <button
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
                className="grid size-10 place-items-center rounded-full bg-parchment text-sunset ring-1 ring-black/5 transition-transform hover:rotate-180 active:scale-90"
                aria-label="Swap stations"
              >
                <ArrowRightLeft size={16} />
              </button>
            </div>
            <div className="sm:col-span-5">
              <label className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                To
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-xl bg-parchment px-3 py-3 ring-1 ring-black/5">
                <MapPin size={16} className="shrink-0 text-sunset" />
                <div className="min-w-0 flex-1">
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="font-display w-full bg-transparent text-xl tracking-tight outline-none"
                  >
                    {STATIONS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="font-mono text-[10px] tracking-wider text-ink-soft">{to}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl bg-parchment px-3 py-2.5 ring-1 ring-black/5">
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                <Users size={14} /> Travellers
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                  aria-label="Remove traveller"
                  className="grid size-7 place-items-center rounded-full bg-parchment-2 text-ink-soft hover:text-sunset active:scale-90"
                >
                  <Minus size={14} />
                </button>
                <span className="font-mono text-sm tabular-nums">{passengers}</span>
                <button
                  onClick={() => setPassengers((p) => Math.min(6, p + 1))}
                  aria-label="Add traveller"
                  className="grid size-7 place-items-center rounded-full bg-parchment-2 text-ink-soft hover:text-sunset active:scale-90"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-parchment px-3 py-2.5 ring-1 ring-black/5">
              <UserRound size={16} className="shrink-0 text-ink-soft" />
              <input
                value={passenger}
                onChange={(e) => setPassenger(e.target.value)}
                placeholder="Passenger name"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
              />
            </div>
          </div>

          <div>
            <span className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              Concession
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONCESSIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConcession(c.id)}
                  className={
                    concession === c.id
                      ? "rounded-full bg-ink px-4 py-2 font-mono text-[10px] tracking-wider text-parchment uppercase"
                      : "rounded-full bg-parchment px-4 py-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase ring-1 ring-black/5 hover:text-ink"
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-parchment">
            <span className="font-mono text-[10px] tracking-[0.2em] text-parchment/50 uppercase">
              Best fare now
            </span>
            <span className="font-display flex items-center gap-1 text-2xl tracking-tight text-gold">
              <IndianRupee size={18} />
              {headlineFare}
            </span>
          </div>
        </section>

        {/* Results */}
        <section className="space-y-3">
          <SectionHeading
            icon={Clock3}
            title="Departures"
            hint={`${results.length} ${mode} service${results.length === 1 ? "" : "s"} found`}
          />
          {results.length === 0 ? (
            <p className="rounded-2xl bg-parchment-2 p-6 text-center font-mono text-xs text-ink-soft ring-1 ring-black/5">
              No {mode} service on this pair yet — try another station.
            </p>
          ) : (
            results.map((s) => {
              const Icon = MODE_ICON[s.mode];
              return (
                <div
                  key={s.id}
                  className="animate-rise rounded-2xl bg-parchment-2 p-4 ring-1 ring-black/5 transition-shadow hover:shadow-panel"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-parchment text-sunset ring-1 ring-black/5">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg tracking-tight">{s.number}</span>
                        <span className="rounded-full bg-parchment px-2 py-0.5 font-mono text-[9px] tracking-wider uppercase">
                          {s.serviceClass}
                        </span>
                        <span
                          className={
                            s.status === "On time"
                              ? "flex items-center gap-1 font-mono text-[10px] text-rail"
                              : "flex items-center gap-1 font-mono text-[10px] text-sunset"
                          }
                        >
                          <Clock3 size={11} />
                          {s.status}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">
                        {stationName(s.fromCode)} → {stationName(s.toCode)} · via {s.via}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-ink-soft tabular-nums">
                        {s.departure} → {s.arrival} · {s.seatsLeft} left
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-xl tracking-tight">
                        ₹{calcFare(s, passengers, concession)}
                      </div>
                      <button
                        onClick={() => book(s.id)}
                        className="mt-2 flex items-center gap-1 rounded-full bg-sunset px-4 py-2 text-sm font-semibold text-on-sunset shadow-sunset transition-colors hover:bg-sunset-soft active:scale-95"
                      >
                        Book <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Latest pass */}
        <section className="animate-rise rounded-2xl bg-parchment-2 p-4 ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <SectionHeading
              icon={Ticket}
              title="Your latest pass"
              hint={`${bookings.length} active`}
            />
            <Link
              to="/tickets"
              className="flex items-center gap-1 font-mono text-[10px] tracking-wider text-sunset uppercase"
            >
              All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-4">
            {latest && latestService ? (
              <TicketPass
                booking={latest}
                serviceLabel={`${latestService.number} · ${latest.seat}`}
                routeLabel={`${stationName(latestService.fromCode)} → ${stationName(latestService.toCode)} · ${latestService.departure}`}
                onCancel={() => cancelBooking(latest.id)}
              />
            ) : (
              <div className="rounded-2xl bg-parchment p-8 text-center">
                <Ticket size={22} className="mx-auto text-ink-soft" />
                <p className="font-display mt-2 text-xl tracking-tight">No pass yet</p>
                <p className="mt-1 font-mono text-xs text-ink-soft">
                  Book a seat above and your ticket prints here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Live + help */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="animate-rise flex flex-col rounded-2xl bg-ink p-5 text-parchment">
            <div className="flex items-center justify-between">
              <SectionHeading icon={Radar} title="On the road" tone="dark" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-gold uppercase">
                Arr. 21:48
              </span>
            </div>
            <div className="animate-sweep font-display mt-4 text-3xl leading-none tracking-tight">
              Route 214
            </div>
            <p className="mt-1 font-mono text-xs text-parchment/60">Delhi → Jaipur · AC Sleeper</p>
            <div className="mt-5 flex flex-1 flex-col gap-4">
              {TRACK_STOPS.map((stop) => (
                <div key={stop.name} className="flex items-start gap-3">
                  <span
                    className={
                      stop.state === "passed"
                        ? "mt-1 size-2.5 rounded-full bg-gold"
                        : stop.state === "current"
                          ? "animate-livepulse mt-1 size-2.5 rounded-full bg-rail"
                          : "mt-1 size-2.5 rounded-full bg-parchment/30"
                    }
                  />
                  <div>
                    <div
                      className={
                        stop.state === "upcoming"
                          ? "text-sm font-semibold text-parchment/70"
                          : "text-sm font-semibold"
                      }
                    >
                      {stop.name}
                    </div>
                    <div className="font-mono text-[10px] text-parchment/50">
                      {stop.time} ·{" "}
                      {stop.state === "passed"
                        ? "Passed"
                        : stop.state === "current"
                          ? "Current"
                          : "Final"}
                    </div>
                  </div>
                  <span
                    className={
                      stop.state === "passed"
                        ? "ml-auto font-mono text-xs text-gold"
                        : stop.state === "current"
                          ? "ml-auto font-mono text-xs text-rail"
                          : "ml-auto font-mono text-xs text-parchment/40"
                    }
                  >
                    {stop.note}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/track"
              className="mt-5 flex items-center justify-between rounded-xl bg-parchment/5 px-4 py-3 ring-1 ring-parchment/10 transition-colors hover:bg-parchment/10"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-parchment/60 uppercase">
                <Radar size={14} /> Open live tracking
              </span>
              <ArrowRight size={14} className="text-gold" />
            </Link>
          </div>

          <div className="animate-rise flex flex-col rounded-2xl bg-ink p-5 text-parchment">
            <SectionHeading icon={ShieldAlert} title="Need help" tone="dark" />
            <Link
              to="/emergency"
              className="animate-sosring font-display mt-4 flex items-center justify-center gap-2 rounded-xl bg-sunset py-4 text-xl tracking-tight text-on-sunset transition-colors hover:bg-sunset-soft"
            >
              <ShieldAlert size={20} /> SOS · Immediate help
            </Link>
            <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
              {[
                ["Police", "112"],
                ["Ambulance", "108"],
                ["NDRF", "1800110006"],
                ["Railhelp", "139"],
              ].map(([label, num]) => (
                <a
                  key={num}
                  href={`tel:${num}`}
                  className="flex items-center justify-between rounded-xl bg-parchment/5 px-3 py-3 ring-1 ring-parchment/10 transition-colors hover:bg-parchment/10"
                >
                  <span className="text-parchment/50">{label}</span>
                  <span className="text-gold">{num}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </AppScreen>
      <TabBar />
    </>
  );
}
