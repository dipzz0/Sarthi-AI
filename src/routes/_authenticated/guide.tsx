import { createFileRoute } from "@tanstack/react-router";

import { VoiceAgent } from "@/components/voice-agent";
import { Compass, LocateFixed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { JourneyPlanCard } from "@/components/journey-plan-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { planJourney, type PlanResult } from "@/lib/journey";
import {
  ALL_STATIONS,
  SAFETY_TIPS,
  autoFareForKm,
  cabFareForKm,
  nearestLandmarks,
  resolveStation,
  type Landmark,
} from "@/lib/mumbai-data";

export const Route = createFileRoute("/_authenticated/guide")({
  head: () => ({
    meta: [
      { title: "Guide me — Sarthi AI" },
      {
        name: "description",
        content:
          "Lost in Mumbai? Share your location or a nearby landmark and get the closest station, fares and the way onward.",
      },
      { property: "og:title", content: "Guide me — Sarthi AI" },
      {
        property: "og:description",
        content: "Nearest landmarks, stations and safe onward routes when you are lost in Mumbai.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidePage,
});

type Near = Landmark & { distanceKm: number };

function GuidePage() {
  const [landmark, setLandmark] = useState("");
  const [destination, setDestination] = useState("");
  const [near, setNear] = useState<Near[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [locating, setLocating] = useState(false);

  const finish = (station: string | null, list: Near[]) => {
    setNear(list);
    setAnchor(station);
    if (station && destination.trim()) {
      setPlan(planJourney({ origin: station, destination: destination.trim() }));
    } else {
      setPlan(null);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const list = nearestLandmarks(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          3,
        ) as Near[];
        finish(list[0]?.nearestStation ?? null, list);
        toast.success("Location found");
      },
      () => {
        setLocating(false);
        toast.error("Location permission is required, or enter a landmark.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const useLandmark = () => {
    const station = resolveStation(landmark.trim());
    if (!station) {
      toast.error("This place was not recognized. Enter a nearby station or area.");
      return;
    }
    finish(station, []);
  };

  const firstMile = near[0]
    ? {
        km: Math.max(near[0].distanceKm, 1),
        auto: autoFareForKm(Math.max(near[0].distanceKm, 1)),
        cab: cabFareForKm(Math.max(near[0].distanceKm, 1)),
      }
    : null;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-display text-xs tracking-[0.25em] text-primary uppercase">Guide me</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Lost your way?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Share your location or enter a nearby landmark to find the nearest station and onward route.
        </p>
      </header>

      <div className="surface-panel space-y-4 p-5">
        <Button onClick={useMyLocation} size="lg" disabled={locating} className="w-full sm:w-auto">
          <LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "Use my location"}
        </Button>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="landmark">Or a landmark / area you can see</Label>
            <Input
              id="landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Gateway of India"
              list="guide-stations"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dest">Where do you want to go? (optional)</Label>
            <Input
              id="dest"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Andheri"
              list="guide-stations"
            />
          </div>
        </div>
        <datalist id="guide-stations">
          {ALL_STATIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Button variant="soft" onClick={useLandmark}>
          <Compass className="h-4 w-4" /> Guide me from here
        </Button>
      </div>

      {(anchor || near.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="surface-panel p-5">
            <h2 className="font-display text-lg font-semibold">Around you</h2>
            {near.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {near.map((n) => (
                  <li key={n.name} className="flex items-center justify-between gap-3">
                    <span>{n.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {n.distanceKm.toFixed(1)} km · {n.nearestStation}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                 Nearest station from the landmark: <span className="text-foreground">{anchor}</span>
              </p>
            )}
            {firstMile && (
              <p className="mt-4 text-xs text-muted-foreground">
                First mile ~{firstMile.km.toFixed(1)} km · auto ≈ ₹{firstMile.auto} · cab ≈ ₹
                {firstMile.cab}
              </p>
            )}
          </div>

          <div className="surface-panel p-5">
            <h2 className="font-display text-lg font-semibold">Stay safe</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
              {SAFETY_TIPS.slice(0, 5).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {plan && !plan.error && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Way onward</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {plan.plans.map((p) => (
              <JourneyPlanCard key={p.label} plan={p} />
            ))}
          </div>
        </section>
      )}
      {plan?.error && <p className="text-sm text-destructive">{plan.error}</p>}
          <VoiceAgent
        section="Guide me"
        context="This page helps a lost traveller find nearby landmarks, stations, first-mile fares and the way onward."
        suggestions={["I’m lost. Please help me.", "What is the nearest station from here?"]}
      />
    </div>
  );
}
