import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BedDouble, Compass, LifeBuoy, MessagesSquare, Route as RouteIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — Sarthi AI" },
      {
        name: "description",
        content:
          "Your Sarthi AI overview: saved journeys, filed complaints and quick access to the voice assistant.",
      },
      { property: "og:title", content: "Overview — Sarthi AI" },
      {
        property: "og:description",
        content: "Saved Mumbai journeys, complaints and your voice travel assistant in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const QUICK = [
  { to: "/assistant", label: "Ask Sarthi", desc: "Voice or text assistant", icon: MessagesSquare },
  { to: "/plan", label: "Plan a journey", desc: "Train, metro, bus, auto", icon: RouteIcon },
  { to: "/stays", label: "Find a stay", desc: "Hotels & hostels", icon: BedDouble },
  { to: "/guide", label: "Guide me", desc: "Lost? Get unlost", icon: Compass },
] as const;

function DashboardPage() {
  const { displayName, user } = useAuth();

  const journeys = useQuery({
    queryKey: ["saved_journeys", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_journeys")
        .select("id, origin, destination, mode_summary, total_minutes, total_fare, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const complaints = useQuery({
    queryKey: ["complaints", "recent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, ticket_no, subject, status, category, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="font-display text-xs tracking-[0.25em] text-primary uppercase">Welcome</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          {displayName ?? "Traveller"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Mumbai’s transport network in one place. Ask by voice or text.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="surface-panel group p-4 transition hover:brightness-110">
            <q.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-semibold">{q.label}</p>
            <p className="text-xs text-muted-foreground">{q.desc}</p>
          </Link>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Saved journeys</h2>
            <Button asChild variant="soft" size="sm">
              <Link to="/plan">Plan new</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {journeys.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {journeys.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                 No journeys saved yet. Plan a journey to save it here.
              </p>
            )}
            {journeys.data?.map((j) => (
              <div key={j.id} className="rounded-xl border border-border/60 p-3">
                <p className="text-sm font-medium">
                  {j.origin} → {j.destination}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {j.mode_summary ?? "Multi-modal"} · {j.total_minutes ?? "—"} min · ₹
                  {j.total_fare ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Complaints</h2>
            <Button asChild variant="soft" size="sm">
              <Link to="/file-complaint">
                <LifeBuoy className="h-4 w-4" /> File one
              </Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {complaints.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {complaints.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No complaints have been filed.</p>
            )}
            {complaints.data?.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{c.subject}</p>
                  <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] text-primary">
                    {c.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.ticket_no} · {c.category}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
