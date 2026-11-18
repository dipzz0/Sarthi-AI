import { createFileRoute } from "@tanstack/react-router";

import { VoiceAgent } from "@/components/voice-agent";
import { Footprints, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAYS, type Stay } from "@/lib/mumbai-data";

export const Route = createFileRoute("/_authenticated/stays")({
  head: () => ({
    meta: [
      { title: "Stays in Mumbai — Sarthi AI" },
      {
        name: "description",
        content:
          "Hotels, boutique stays and hostels across Mumbai ranked by nightly rate, rating and walking minutes from the nearest station.",
      },
      { property: "og:title", content: "Stays in Mumbai — Sarthi AI" },
      {
        property: "og:description",
        content: "Find a place to stay close to the line you are travelling on.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaysPage,
});

const CATEGORIES: Array<Stay["category"] | "All"> = [
  "All",
  "Luxury",
  "Business",
  "Boutique",
  "Budget",
  "Hostel",
];

function StaysPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [maxPrice, setMaxPrice] = useState(25000);
  const [near, setNear] = useState("");

  const results = useMemo(() => {
    const q = near.trim().toLowerCase();
    return STAYS.filter(
      (s) =>
        (category === "All" || s.category === category) &&
        s.pricePerNight <= maxPrice &&
        (q === "" ||
          s.area.toLowerCase().includes(q) ||
          s.nearestStation.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)),
    ).sort((a, b) => b.rating - a.rating);
  }, [category, maxPrice, near]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Stays</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Indicative nightly rates. Walking minutes measured from the nearest station.
        </p>
      </header>

      <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="near">Area or station</Label>
          <Input
            id="near"
            value={near}
            onChange={(e) => setNear(e.target.value)}
            placeholder="Colaba, Andheri, BKC…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Max per night: ₹{maxPrice.toLocaleString("en-IN")}</Label>
          <input
            id="price"
            type="range"
            min={800}
            max={25000}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[hsl(var(--primary))]"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={category === c ? "default" : "soft"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((s) => (
          <article key={s.id} className="surface-panel flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-base font-semibold">{s.name}</h2>
              <Badge variant="secondary">{s.category}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.area}</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-primary" /> {s.rating}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Footprints className="h-4 w-4" /> {s.walkMinutes} min from {s.nearestStation}
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {s.perks.map((p) => (
                <li
                  key={p}
                  className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-foreground"
                >
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-display text-xl font-semibold">
              ₹{s.pricePerNight.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-muted-foreground"> / night</span>
            </p>
          </article>
        ))}
      </div>

      {results.length === 0 && (
        <p className="text-sm text-muted-foreground">No stays match those filters.</p>
      )}
          <VoiceAgent
        section="Stays"
        context="This page lists Mumbai hotels, hostels and budget stays with area, price and nearest station filters. Help pick a stay."
        suggestions={["Find hotels near Bandra for up to ₹3,000", "Find hostels near CSMT"]}
      />
    </div>
  );
}
