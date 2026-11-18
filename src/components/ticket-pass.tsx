import type { Booking } from "@/lib/transit-data";

function StubGrid({ seed }: { seed: string }) {
  const cells = Array.from({ length: 64 }, (_, i) => {
    const code = seed.charCodeAt(i % seed.length) + i * 7;
    return code % 3 !== 0;
  });
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {cells.map((on, i) => (
        <span key={i} className={on ? "size-1.5 bg-ink" : "size-1.5 bg-ink/30"} />
      ))}
    </div>
  );
}

export function TicketPass({
  booking,
  serviceLabel,
  routeLabel,
  onCancel,
}: {
  booking: Booking;
  serviceLabel: string;
  routeLabel: string;
  onCancel?: () => void;
}) {
  return (
    <div className="flex">
      <div className="flex-1 rounded-l-2xl bg-parchment p-5">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl tracking-tight">{serviceLabel}</span>
          <span className="font-mono text-[10px] text-ink-soft">PNR</span>
        </div>
        <div className="mt-1 font-mono text-xs text-ink-soft">{booking.pnr}</div>
        <div className="mt-1 font-mono text-[11px] text-ink-soft">{routeLabel}</div>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              Passenger
            </div>
            <div className="text-sm font-semibold">{booking.passenger}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">Seat</div>
            <div className="text-sm font-semibold">{booking.seat}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">Paid</div>
            <div className="font-display text-lg tracking-tight">₹{booking.fare}</div>
          </div>
        </div>
        {onCancel ? (
          <button
            onClick={onCancel}
            className="mt-4 font-mono text-[10px] tracking-[0.15em] text-sunset uppercase transition-opacity hover:opacity-70"
          >
            Cancel booking
          </button>
        ) : null}
      </div>
      <div className="w-px border-l border-dashed border-line" />
      <div className="flex w-28 flex-col items-center justify-center gap-2 rounded-r-2xl bg-parchment p-4">
        <StubGrid seed={booking.pnr} />
        <span className="font-mono text-[9px] tracking-widest text-ink-soft">SCAN HERE</span>
      </div>
    </div>
  );
}
