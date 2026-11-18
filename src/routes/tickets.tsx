import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAccount } from "@/lib/require-auth";
import { ArrowRight, IndianRupee, Radar, Search, Ticket } from "lucide-react";
import { AppScreen, SectionHeading, TabBar } from "@/components/site-chrome";
import { TicketPass } from "@/components/ticket-pass";
import { SERVICES, stationName } from "@/lib/transit-data";
import { cancelBooking, useTransitState } from "@/lib/transit-store";

export const Route = createFileRoute("/tickets")({
  ssr: false,
  beforeLoad: requireAccount,
  head: () => ({
    meta: [
      { title: "My Tickets — Sarthi AI" },
      {
        name: "description",
        content:
          "View every Sarthi AI bus, auto and train ticket you have booked, with PNR, seat, fare paid and one-tap cancellation.",
      },
      { property: "og:title", content: "My Tickets — Sarthi AI" },
      {
        property: "og:description",
        content: "All your booked bus, auto and train passes in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketsPage,
});

function TicketsPage() {
  const { bookings } = useTransitState();
  const totalPaid = bookings.reduce((sum, b) => sum + b.fare, 0);

  return (
    <>
      <AppScreen title="My tickets" subtitle="Wallet" back>
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-parchment-2 p-4 ring-1 ring-black/5">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              <Ticket size={13} /> Active passes
            </div>
            <div className="font-display mt-1 text-2xl tracking-tight tabular-nums">
              {bookings.length}
            </div>
          </div>
          <div className="rounded-2xl bg-ink p-4 text-parchment">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-parchment/50 uppercase">
              <IndianRupee size={13} /> Total paid
            </div>
            <div className="font-display mt-1 text-2xl tracking-tight text-gold tabular-nums">
              ₹{totalPaid}
            </div>
          </div>
        </section>

        <SectionHeading icon={Ticket} title="Your passes" hint="Tap cancel to release a seat" />

        {bookings.length === 0 ? (
          <div className="board-surface animate-rise rounded-2xl p-10 text-center">
            <Ticket size={24} className="mx-auto text-ink-soft" />
            <div className="font-display mt-2 text-2xl tracking-tight">No tickets yet</div>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink/70">
              Search a route on the booking screen and your pass will appear here with PNR, seat and
              fare.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-sunset px-5 py-3 text-sm font-semibold text-on-sunset shadow-sunset transition-colors hover:bg-sunset-soft active:scale-95"
            >
              <Search size={15} /> Book a journey
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {bookings.map((b) => {
              const svc = SERVICES.find((s) => s.id === b.serviceId);
              return (
                <div
                  key={b.id}
                  className="animate-rise rounded-2xl bg-parchment-2 p-3 ring-1 ring-black/5 transition-shadow hover:shadow-panel"
                >
                  <div className="flex items-center justify-between px-2 pb-2">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-ink-soft uppercase">
                      {svc?.serviceClass ?? "Pass"} · {b.bookedAt}
                    </span>
                    <span className="rounded-full bg-rail/15 px-3 py-1 font-mono text-[10px] tracking-wider text-rail uppercase">
                      Confirmed
                    </span>
                  </div>
                  <TicketPass
                    booking={b}
                    serviceLabel={svc?.number ?? "Sarthi AI service"}
                    routeLabel={
                      svc
                        ? `${stationName(svc.fromCode)} → ${stationName(svc.toCode)} · ${svc.departure}`
                        : "Route details unavailable"
                    }
                    onCancel={() => cancelBooking(b.id)}
                  />
                  <div className="px-2 pt-3">
                    <Link
                      to="/track"
                      className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-ink-soft uppercase transition-colors hover:text-sunset"
                    >
                      <Radar size={13} /> Track this journey <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppScreen>
      <TabBar />
    </>
  );
}
