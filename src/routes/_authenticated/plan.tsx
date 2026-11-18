import { createFileRoute } from "@tanstack/react-router";

import { VoiceAgent } from "@/components/voice-agent";
import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { JourneyPlanCard } from "@/components/journey-plan-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { planJourney, type PlanResult } from "@/lib/journey";
import { ALL_STATIONS } from "@/lib/mumbai-data";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "Journey planner — Sarthi AI" },
      {
        name: "description",
        content:
          "Compare fastest, cheapest and fewest-change routes across Mumbai local trains, metro, monorail, bus and auto with real fares and timings.",
      },
      { property: "og:title", content: "Journey planner — Sarthi AI" },
      {
        property: "og:description",
        content: "Plan any Mumbai trip across every line with fares, timings and transfers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { user } = useAuth();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const stations = useMemo(() => ALL_STATIONS, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const res = planJourney({ origin, destination });
    setResult(res);
    if (res.error) toast.error(res.error);
  };

  const save = async (planId: string) => {
    const plan = result?.plans.find((p) => p.id === planId);
    if (!plan || !user) return;
    setSaving(planId);
    const { error } = await supabase.from("saved_journeys").insert({
      user_id: user.id,
      origin: plan.origin,
      destination: plan.destination,
      mode_summary: plan.modeSummary,
      total_minutes: plan.totalMinutes,
      total_fare: plan.totalFare,
      legs: plan.legs as unknown as never,
    });
    setSaving(null);
    if (error) toast.error("Could not save this journey.");
    else toast.success("Journey saved");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Journey planner
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every local, metro, monorail, bus and ferry line — compared three ways.
        </p>
      </header>

      <form className="surface-panel grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto]" onSubmit={search}>
        <div className="space-y-1.5">
          <Label htmlFor="origin">From</Label>
          <Input
            id="origin"
            list="stations"
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Andheri"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination">To</Label>
          <Input
            id="destination"
            list="stations"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="CSMT"
          />
        </div>
        <datalist id="stations">
          {stations.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex items-end">
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <Search className="h-4 w-4" /> Plan
          </Button>
        </div>
      </form>

      {result?.doorToDoor.distanceKm ? (
        <div className="surface-panel p-5 text-sm">
          <p className="font-medium">Door to door by road</p>
          <p className="mt-1 text-muted-foreground">
            ~{result.doorToDoor.distanceKm} km · auto ≈ ₹{result.doorToDoor.autoFare} · cab ≈ ₹
            {result.doorToDoor.cabFare} · {result.doorToDoor.driveMinutes} min in normal traffic
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {result?.plans.map((plan) => (
          <JourneyPlanCard
            key={plan.id}
            plan={plan}
            action={
              <Button variant="soft" size="sm" onClick={() => save(plan.id)} disabled={!!saving}>
                {saving === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
              </Button>
            }
          />
        ))}
      </div>

      {result && !result.error && result.plans.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No route found between those two places. Try nearby stations.
        </p>
      )}
          <VoiceAgent
        section="Journey planner"
        context="This page plans routes between two Mumbai places with fastest, cheapest and fewest-change options. Help with route, fare and timing questions."
        suggestions={["What is the cheapest route from Andheri to CSMT?", "How long does it take from Dadar to Vashi?"]}
      />
    </div>
  );
}
