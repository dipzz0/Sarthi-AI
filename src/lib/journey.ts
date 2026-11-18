import {
  LANDMARKS,
  LINES,
  MODE_LABEL,
  autoFareForKm,
  cabFareForKm,
  haversineKm,
  resolveStation,
  type ModeId,
  type TransitLine,
} from "./mumbai-data";

export interface JourneyLeg {
  lineId: string;
  lineName: string;
  operator: string;
  mode: ModeId;
  modeLabel: string;
  colorToken: string;
  from: string;
  to: string;
  stops: string[];
  minutes: number;
  fare: number;
  headway: string;
  serviceWindow: string;
  note?: string;
}

export interface JourneyPlan {
  id: string;
  label: string;
  origin: string;
  destination: string;
  legs: JourneyLeg[];
  totalMinutes: number;
  totalFare: number;
  transfers: number;
  modeSummary: string;
  tips: string[];
}

interface NodeKey {
  line: string;
  station: string;
}

const key = (n: NodeKey) => `${n.line}|${n.station}`;

const TRANSFER_MINUTES: Record<string, number> = {
  same: 4,
  cross: 8,
};

function transferPenalty(from: TransitLine, to: TransitLine) {
  return (from.operator === to.operator ? TRANSFER_MINUTES["same"] : TRANSFER_MINUTES["cross"]) ?? 6;
}

interface Weights {
  timeWeight: number;
  fareWeight: number;
  transferWeight: number;
  allowModes?: ModeId[];
}

function dijkstra(origin: string, destination: string, w: Weights) {
  const lines = LINES.filter((l) => !w.allowModes || w.allowModes.includes(l.mode));
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const meta = new Map<string, { minutes: number; fare: number }>();
  const queue = new Set<string>();

  const nodeIndex = new Map<string, NodeKey>();
  for (const line of lines) {
    for (const station of line.stations) {
      const k = key({ line: line.id, station });
      nodeIndex.set(k, { line: line.id, station });
      dist.set(k, Infinity);
      meta.set(k, { minutes: 0, fare: 0 });
      prev.set(k, null);
      queue.add(k);
    }
  }

  const lineById = new Map(lines.map((l) => [l.id, l]));

  // Seed: boarding any line that serves the origin.
  for (const line of lines) {
    if (!line.stations.includes(origin)) continue;
    const k = key({ line: line.id, station: origin });
    dist.set(k, w.fareWeight * line.baseFare);
    meta.set(k, { minutes: 0, fare: line.baseFare });
  }

  const neighbours = (k: string): Array<{ to: string; cost: number; minutes: number; fare: number }> => {
    const node = nodeIndex.get(k)!;
    const line = lineById.get(node.line)!;
    const idx = line.stations.indexOf(node.station);
    const out: Array<{ to: string; cost: number; minutes: number; fare: number }> = [];

    for (const step of [-1, 1]) {
      const next = line.stations[idx + step];
      if (!next) continue;
      out.push({
        to: key({ line: line.id, station: next }),
        cost: w.timeWeight * line.hopMinutes + w.fareWeight * line.farePerHop,
        minutes: line.hopMinutes,
        fare: line.farePerHop,
      });
    }

    for (const other of lines) {
      if (other.id === line.id) continue;
      if (!other.stations.includes(node.station)) continue;
      const pen = transferPenalty(line, other);
      out.push({
        to: key({ line: other.id, station: node.station }),
        cost: w.timeWeight * pen + w.fareWeight * other.baseFare + w.transferWeight,
        minutes: pen,
        fare: other.baseFare,
      });
    }
    return out;
  };

  while (queue.size) {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const k of queue) {
      const d = dist.get(k)!;
      if (d < bestDist) {
        bestDist = d;
        best = k;
      }
    }
    if (!best || bestDist === Infinity) break;
    queue.delete(best);
    if (nodeIndex.get(best)!.station === destination) break;

    for (const edge of neighbours(best)) {
      if (!queue.has(edge.to)) continue;
      const alt = bestDist + edge.cost;
      if (alt < dist.get(edge.to)!) {
        dist.set(edge.to, alt);
        prev.set(edge.to, best);
        const m = meta.get(best)!;
        meta.set(edge.to, { minutes: m.minutes + edge.minutes, fare: m.fare + edge.fare });
      }
    }
  }

  let endKey: string | null = null;
  let endDist = Infinity;
  for (const [k, node] of nodeIndex) {
    if (node.station !== destination) continue;
    const d = dist.get(k)!;
    if (d < endDist) {
      endDist = d;
      endKey = k;
    }
  }
  if (!endKey || endDist === Infinity) return null;

  const path: string[] = [];
  let cursor: string | null = endKey;
  while (cursor) {
    path.unshift(cursor);
    cursor = prev.get(cursor) ?? null;
  }

  const legs: JourneyLeg[] = [];
  for (const k of path) {
    const node = nodeIndex.get(k)!;
    const line = lineById.get(node.line)!;
    const last = legs[legs.length - 1];
    if (last && last.lineId === line.id) {
      last.to = node.station;
      last.stops.push(node.station);
      last.minutes = Math.round((last.stops.length - 1) * line.hopMinutes);
      last.fare = Math.round(line.baseFare + (last.stops.length - 1) * line.farePerHop);
    } else {
      legs.push({
        lineId: line.id,
        lineName: line.name,
        operator: line.operator,
        mode: line.mode,
        modeLabel: MODE_LABEL[line.mode],
        colorToken: line.colorToken,
        from: node.station,
        to: node.station,
        stops: [node.station],
        minutes: 0,
        fare: line.baseFare,
        headway: line.headwayPeak,
        serviceWindow: `${line.firstTrain} – ${line.lastTrain}`,
        ...(line.note ? { note: line.note } : {}),
      });
    }
  }

  const usable = legs.filter((l) => l.stops.length > 1);
  if (!usable.length) return null;

  const transferMinutes = (usable.length - 1) * 6;
  const totalMinutes = Math.round(usable.reduce((s, l) => s + l.minutes, 0) + transferMinutes);
  const totalFare = Math.round(usable.reduce((s, l) => s + l.fare, 0));

  return { legs: usable, totalMinutes, totalFare };
}

function tipsFor(legs: JourneyLeg[]): string[] {
  const tips: string[] = [];
  if (legs.some((l) => l.mode === "local" || l.mode === "express")) {
    tips.push("Buy the ticket on UTS app or use your NCMC / Mumbai 1 card to skip the queue.");
  }
  if (legs.some((l) => l.mode === "metro")) {
    tips.push("Metro stations have security checks — keep 5 extra minutes for the frisking line.");
  }
  if (legs.length > 1) {
    tips.push(`This route has ${legs.length - 1} change${legs.length > 2 ? "s" : ""} — follow the platform signs to the connecting line.`);
  }
  if (legs.some((l) => l.mode === "bus")) {
    tips.push("Bus fares are cheapest on the Chalo app; conductors also take UPI.");
  }
  tips.push("Peak hours (08:00–11:00 and 17:30–21:00) are extremely crowded — travel outside them if you can.");
  return tips;
}

function summarise(legs: JourneyLeg[]) {
  return legs.map((l) => l.modeLabel).join(" → ");
}

export interface PlanRequest {
  origin: string;
  destination: string;
  preference?: "fastest" | "cheapest" | "fewest_changes";
}

export interface PlanResult {
  origin: string;
  destination: string;
  resolvedOrigin: string | null;
  resolvedDestination: string | null;
  plans: JourneyPlan[];
  doorToDoor: {
    distanceKm: number | null;
    autoFare: number | null;
    cabFare: number | null;
    driveMinutes: number | null;
  };
  error?: string;
}

export function planJourney(req: PlanRequest): PlanResult {
  const origin = resolveStation(req.origin);
  const destination = resolveStation(req.destination);

  const base: PlanResult = {
    origin: req.origin,
    destination: req.destination,
    resolvedOrigin: origin,
    resolvedDestination: destination,
    plans: [],
    doorToDoor: { distanceKm: null, autoFare: null, cabFare: null, driveMinutes: null },
  };

  if (!origin || !destination) {
    return {
      ...base,
      error: `Could not recognise ${!origin ? req.origin : req.destination} as a Mumbai station or landmark.`,
    };
  }
  if (origin === destination) {
    return { ...base, error: "Start and destination are the same place." };
  }

  const variants: Array<{ id: string; label: string; weights: Weights }> = [
    { id: "fastest", label: "Fastest", weights: { timeWeight: 1, fareWeight: 0.05, transferWeight: 3 } },
    { id: "cheapest", label: "Cheapest", weights: { timeWeight: 0.25, fareWeight: 1, transferWeight: 2 } },
    { id: "comfort", label: "Fewest changes", weights: { timeWeight: 1, fareWeight: 0.1, transferWeight: 25 } },
  ];

  const seen = new Set<string>();
  const plans: JourneyPlan[] = [];
  for (const v of variants) {
    const result = dijkstra(origin, destination, v.weights);
    if (!result) continue;
    const signature = result.legs.map((l) => `${l.lineId}:${l.from}>${l.to}`).join("|");
    if (seen.has(signature)) continue;
    seen.add(signature);
    plans.push({
      id: v.id,
      label: v.label,
      origin,
      destination,
      legs: result.legs,
      totalMinutes: result.totalMinutes,
      totalFare: result.totalFare,
      transfers: result.legs.length - 1,
      modeSummary: summarise(result.legs),
      tips: tipsFor(result.legs),
    });
  }

  const a = LANDMARKS.find((l) => l.nearestStation === origin || l.name === origin);
  const b = LANDMARKS.find((l) => l.nearestStation === destination || l.name === destination);
  if (a && b) {
    const km = Number((haversineKm(a, b) * 1.35).toFixed(1));
    base.doorToDoor = {
      distanceKm: km,
      autoFare: autoFareForKm(km),
      cabFare: cabFareForKm(km),
      driveMinutes: Math.round((km / 22) * 60),
    };
  }

  if (!plans.length) {
    return { ...base, error: "No public transport route found between these two points." };
  }

  return { ...base, plans: plans.sort((x, y) => x.totalMinutes - y.totalMinutes) };
}
