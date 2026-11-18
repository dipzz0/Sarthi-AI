import { createFileRoute } from "@tanstack/react-router";
import { requireAccount } from "@/lib/require-auth";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  PhoneCall,
  Radio,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { AppScreen, SectionHeading, TabBar } from "@/components/site-chrome";
import { EMERGENCY_CONTACTS, EMERGENCY_KINDS, SERVICES } from "@/lib/transit-data";
import { addEmergency, makeId, nowLabel, useTransitState } from "@/lib/transit-store";

export const Route = createFileRoute("/emergency")({
  ssr: false,
  beforeLoad: requireAccount,
  head: () => ({
    meta: [
      { title: "Emergency & SOS — Sarthi AI" },
      {
        name: "description",
        content:
          "Raise an SOS on any bus, auto or train: medical, harassment, accident, fire or theft. One-tap helplines for police, ambulance, NDRF and railway help.",
      },
      { property: "og:title", content: "Emergency & SOS — Sarthi AI" },
      {
        property: "og:description",
        content: "One-tap SOS and helpline access for every Sarthi AI transit rider.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmergencyPage,
});

function EmergencyPage() {
  const { emergencies } = useTransitState();
  const [kind, setKind] = useState(EMERGENCY_KINDS[0]!);
  const [location, setLocation] = useState(SERVICES[0]!.number);
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  function raise() {
    const id = makeId("SOS");
    addEmergency({
      id,
      kind,
      location,
      detail: detail.trim() || "No further detail provided.",
      raisedAt: nowLabel(),
    });
    setDetail("");
    setSent(id);
  }

  return (
    <>
      <AppScreen title="Emergency & SOS" subtitle="Help is one tap away" back>
        <section className="animate-rise rounded-2xl bg-ink p-5 text-parchment">
          <SectionHeading icon={PhoneCall} title="Call now" tone="dark" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <a
                key={c.number}
                href={`tel:${c.number}`}
                className="flex items-center justify-between rounded-xl bg-parchment/5 px-4 py-4 ring-1 ring-parchment/10 transition-colors hover:bg-parchment/10 active:scale-95"
              >
                <span className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-parchment/50 uppercase">
                  <PhoneCall size={12} /> {c.label}
                </span>
                <span className="font-display text-lg tracking-tight text-gold">{c.number}</span>
              </a>
            ))}
          </div>

          <button
            onClick={raise}
            className="animate-sosring font-display mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sunset py-5 text-2xl tracking-tight text-on-sunset transition-colors hover:bg-sunset-soft active:scale-[0.98]"
          >
            <ShieldAlert size={24} /> Raise SOS now
          </button>
          {sent ? (
            <p className="animate-rise mt-3 flex items-center gap-2 font-mono text-[11px] text-gold">
              <CheckCircle2 size={14} /> {sent} broadcast to the nearest control room · stay on this
              screen.
            </p>
          ) : null}
        </section>

        <section className="board-surface animate-rise space-y-4 rounded-2xl p-4 sm:p-6">
          <SectionHeading icon={AlertTriangle} title="Report details" hint="Helps responders" />
          <div>
            <label className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              <AlertTriangle size={12} /> Nature of emergency
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMERGENCY_KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={
                    kind === k
                      ? "rounded-full bg-sunset px-4 py-2 font-mono text-[10px] tracking-wider text-on-sunset uppercase"
                      : "rounded-full bg-parchment px-4 py-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase ring-1 ring-black/5 hover:text-ink"
                  }
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              <MapPin size={12} /> Where are you
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 w-full rounded-xl bg-parchment px-4 py-3 text-sm ring-1 ring-black/5 outline-none focus:ring-sunset"
            >
              {SERVICES.map((s) => (
                <option key={s.id} value={s.number}>
                  {s.number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              <FileText size={12} /> Detail (optional)
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder="Coach, seat, landmark…"
              className="mt-2 w-full resize-none rounded-xl bg-parchment px-4 py-3 text-sm ring-1 ring-black/5 outline-none placeholder:text-ink-soft focus:ring-sunset"
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading
            icon={Radio}
            title="Raised reports"
            hint={`${emergencies.length} from this device`}
          />
          {emergencies.length === 0 ? (
            <p className="rounded-2xl bg-parchment-2 p-6 text-center font-mono text-xs text-ink-soft ring-1 ring-black/5">
              No SOS raised from this device.
            </p>
          ) : (
            emergencies.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-parchment-2 px-4 py-3 ring-1 ring-black/5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {e.kind} · {e.location}
                  </div>
                  <div className="truncate font-mono text-[10px] text-ink-soft">
                    {e.id} · {e.raisedAt} · {e.detail}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-sunset/15 px-3 py-1 font-mono text-[10px] tracking-wider text-sunset uppercase">
                  Active
                </span>
              </div>
            ))
          )}
        </section>
      </AppScreen>
      <TabBar />
    </>
  );
}
