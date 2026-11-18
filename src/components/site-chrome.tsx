import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronLeft,
  MessageSquareWarning,
  Radar,
  ScanEye,
  Search,
  Sparkle,
  Ticket,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const NAV = [
  { to: "/", label: "Book", icon: Search },
  { to: "/assistant", label: "Sarthi", icon: Sparkle },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/track", label: "Track", icon: Radar },
  { to: "/scan", label: "Scan", icon: ScanEye },
  { to: "/complaints", label: "Report", icon: MessageSquareWarning },
  { to: "/emergency", label: "SOS", icon: AlertTriangle },
] as const;

function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        }).format(new Date()),
      );
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="font-mono text-xs tabular-nums">{time ?? "--:--"}</span>;
}

/** Compact native-app style top bar. */
export function AppBar({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string | undefined;
  back?: boolean | undefined;
}) {
  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-50 h-1 bg-gradient-to-r from-sunset-soft via-gold to-sunset" />
      <header className="sticky top-0 z-40 border-b border-line bg-parchment/95 backdrop-blur">
        <div className="animate-rise mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-4">
          {back ? (
            <Link
              to="/"
              aria-label="Back to booking"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-parchment-2 text-ink-soft transition-colors hover:text-sunset active:scale-95"
            >
              <ChevronLeft size={18} />
            </Link>
          ) : title === "Sarthi AI" ? (
            <Link
              to="/"
              aria-label="Sarthi AI home"
              className="flex h-12 shrink-0 items-center"
            >
              <BrandLogo />
            </Link>
          ) : null}
          <div className={title === "Sarthi AI" && !subtitle ? "flex-1" : "min-w-0 flex-1"}>
            {title === "Sarthi AI" && !subtitle ? null : <>
            <div className="font-display truncate text-lg leading-none tracking-tight">{title}</div>
            {subtitle ? (
              <div className="mt-1 truncate font-mono text-[10px] tracking-[0.15em] text-ink-soft uppercase">
                {subtitle}
              </div>
            ) : null}
            </>}
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-full bg-parchment-2 px-3 py-1.5 sm:flex">
            <span className="animate-livepulse size-1.5 rounded-full bg-rail" />
            <Clock />
          </div>
          <Link
            to="/account"
            aria-label="Account settings"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-parchment-2 text-ink transition-colors hover:text-sunset active:scale-95"
          >
            <UserRound size={18} />
          </Link>
        </div>
      </header>
    </>
  );
}

/** Bottom tab bar — visible on every screen size for the app feel. */
export function TabBar() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-line bg-parchment/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-[620px] grid-cols-7">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="group flex flex-col items-center gap-1 py-2.5 text-ink-soft transition-colors active:scale-95"
              activeProps={{ className: "text-sunset" }}
            >
              <span className="grid size-8 place-items-center rounded-xl transition-colors group-hover:bg-parchment-2">
                <Icon size={18} />
              </span>
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Page shell: app bar + scroll area + tab bar. */
export function AppScreen({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  back?: boolean | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment pb-24 text-ink">
      <AppBar title={title} subtitle={subtitle} back={back} />
      <main className="mx-auto max-w-[1100px] space-y-5 px-4 py-5">{children}</main>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.25em] text-ink-soft uppercase">
      {children}
    </span>
  );
}

/** Section header with a function-matching icon. */
export function SectionHeading({
  icon: Icon,
  title,
  hint,
  tone = "light",
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          tone === "dark"
            ? "grid size-8 shrink-0 place-items-center rounded-lg bg-parchment/10 text-gold"
            : "grid size-8 shrink-0 place-items-center rounded-lg bg-parchment text-sunset ring-1 ring-black/5"
        }
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div
          className={
            tone === "dark"
              ? "font-mono text-[10px] tracking-[0.25em] text-parchment/60 uppercase"
              : "font-mono text-[10px] tracking-[0.25em] text-ink-soft uppercase"
          }
        >
          {title}
        </div>
        {hint ? (
          <div
            className={
              tone === "dark"
                ? "truncate font-mono text-[10px] text-parchment/40"
                : "truncate font-mono text-[10px] text-ink-soft"
            }
          >
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}
