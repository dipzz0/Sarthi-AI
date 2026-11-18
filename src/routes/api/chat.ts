import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
  requireLovableApiKey,
} from "@/lib/ai-gateway.server";
import { planJourney } from "@/lib/journey";
import {
  LINES,
  SAFETY_TIPS,
  STAYS,
  TRAVEL_PASSES,
  autoFareForKm,
  cabFareForKm,
  nearestLandmarks,
  resolveStation,
} from "@/lib/mumbai-data";

interface ChatBody {
  messages?: UIMessage[];
  location?: { lat: number; lng: number } | null;
  userName?: string | null;
  pageContext?: string | null;
}

const SYSTEM = `You are "Sarthi", the travel assistant inside Sarthi AI — a premium Mumbai (Maharashtra) travel companion.

Scope: Mumbai Metropolitan Region only — suburban local trains (Western, Central, Harbour, Trans-Harbour, fast locals, MEMU shuttles), Metro lines (1 Blue, 2A Yellow, 3 Aqua, 7 Red, 9), the Monorail, BEST/NMMT/TMT buses, auto rickshaws, cabs and ferries, plus hotels and complaints.

Rules:
- ALWAYS use the tools for routes, stays, line facts and lost-user help. Never invent fares, timings or station names.
- Reply in the language the user writes in. Hindi/Hinglish in, Hindi/Hinglish out. Keep it warm, short and practical.
- Answers are read aloud, so use short sentences and plain words. Use markdown lists for steps; no tables, no emojis.
- For a route, state total time, total fare, and each leg in order with where to change.
- When the user reports a problem (dirty coach, rash driving, overcharging, safety), call draft_complaint and tell them to confirm it on screen.
- If someone is lost, ask for permission to use their location or for the nearest landmark, then call guide_me.
- Never promise live running status; say timings are scheduled averages.
- Answer ONLY what was asked. No extra suggestions, no unrelated info, no repeating the question. If one line is enough, give one line.
- Be fast: do not think out loud, do not explain your reasoning, keep replies under 70 words. Call at most one tool, then answer straight away.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatBody;
        try {
          body = (await request.json()) as ChatBody;
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        let apiKey: string;
        try {
          apiKey = requireLovableApiKey();
        } catch {
          return new Response(
            JSON.stringify({ error: "The assistant is not configured yet." }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        const gateway = createLovableAiGatewayProvider(apiKey, getLovableAiGatewayRunId(request));

        const tools = {
          plan_journey: tool({
            description:
              "Plan the best public transport route between two Mumbai places (station names or landmarks). Returns fastest, cheapest and fewest-change options with fares and timings.",
            inputSchema: z.object({
              origin: z.string().describe("Starting station, area or landmark in Mumbai"),
              destination: z.string().describe("Destination station, area or landmark"),
            }),
            execute: async ({ origin, destination }) => planJourney({ origin, destination }),
          }),
          find_stays: tool({
            description:
              "Find hotels, budget stays or hostels in Mumbai, optionally filtered by area, budget per night in rupees, or how close they are to a station.",
            inputSchema: z.object({
              area: z.string().nullable().describe("Area or nearby station, null for anywhere"),
              maxBudget: z.number().nullable().describe("Maximum rupees per night, null for any"),
              category: z
                .enum(["Luxury", "Business", "Boutique", "Budget", "Hostel"])
                .nullable(),
            }),
            execute: async ({ area, maxBudget, category }) => {
              const station = area ? resolveStation(area) : null;
              const results = STAYS.filter((s) => {
                if (maxBudget && s.pricePerNight > maxBudget) return false;
                if (category && s.category !== category) return false;
                if (area) {
                  const q = area.toLowerCase();
                  const match =
                    s.area.toLowerCase().includes(q) ||
                    s.nearestStation.toLowerCase().includes(q) ||
                    (station ? s.nearestStation === station : false);
                  if (!match) return false;
                }
                return true;
              }).sort((a, b) => b.rating - a.rating);
              return { count: results.length, stays: results.slice(0, 6) };
            },
          }),
          line_info: tool({
            description:
              "Get facts about a Mumbai transit line or a station: operator, first and last service, frequency, stations on the line, and travel passes.",
            inputSchema: z.object({
              query: z.string().describe("A line name, e.g. 'Aqua line', or a station name"),
            }),
            execute: async ({ query }) => {
              const q = query.toLowerCase();
              const byLine = LINES.filter(
                (l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q),
              );
              const station = resolveStation(query);
              const serving = station
                ? LINES.filter((l) => l.stations.includes(station)).map((l) => ({
                    name: l.name,
                    operator: l.operator,
                    service: `${l.firstTrain} – ${l.lastTrain}`,
                    headwayPeak: l.headwayPeak,
                  }))
                : [];
              return {
                matchedLines: byLine.map((l) => ({
                  name: l.name,
                  operator: l.operator,
                  service: `${l.firstTrain} – ${l.lastTrain}`,
                  headwayPeak: l.headwayPeak,
                  stations: l.stations,
                  note: l.note ?? null,
                })),
                station,
                linesServingStation: serving,
                passes: TRAVEL_PASSES,
                safety: SAFETY_TIPS,
              };
            },
          }),
          guide_me: tool({
            description:
              "Help a lost traveller. Give coordinates (if the user shared location) or a landmark they can see, plus an optional destination, and get the nearest transport points and the way out.",
            inputSchema: z.object({
              lat: z.number().nullable(),
              lng: z.number().nullable(),
              landmark: z.string().nullable().describe("What the user can see around them"),
              destination: z.string().nullable(),
            }),
            execute: async ({ lat, lng, landmark, destination }) => {
              const point =
                lat != null && lng != null
                  ? { lat, lng }
                  : body.location ?? null;
              const near = point ? nearestLandmarks(point, 3) : [];
              const anchorStation = point
                ? near[0]?.nearestStation ?? null
                : landmark
                  ? resolveStation(landmark)
                  : null;
              const onward =
                anchorStation && destination
                  ? planJourney({ origin: anchorStation, destination })
                  : null;
              const walk = near[0]
                ? {
                    landmark: near[0].name,
                    distanceKm: near[0].distanceKm,
                    autoFare: autoFareForKm(Math.max(near[0].distanceKm, 1)),
                    cabFare: cabFareForKm(Math.max(near[0].distanceKm, 1)),
                  }
                : null;
              return { nearbyPoints: near, anchorStation, firstMile: walk, onward, safety: SAFETY_TIPS };
            },
          }),
          draft_complaint: tool({
            description:
              "Prepare a complaint for the user to confirm and file. Use it whenever the user reports a problem with any vehicle, staff, station or service.",
            inputSchema: z.object({
              category: z.enum([
                "Local train",
                "Metro",
                "Monorail",
                "Bus",
                "Auto rickshaw",
                "Cab",
                "Station",
                "Safety",
                "Other",
              ]),
              subject: z.string().describe("Short one-line title"),
              description: z.string().describe("Full complaint in the user's own words, cleaned up"),
              authority: z.string().nullable().describe("Who should handle it, e.g. Western Railway, BEST, MMRC, RTO"),
              vehicle_no: z.string().nullable(),
              location: z.string().nullable(),
            }),
            execute: async (draft) => ({
              status: "draft_ready",
              draft,
              instruction:
                "Show this draft on screen. The user must press Confirm to actually file it.",
            }),
          }),
        };

        const contextLine = [
          body.userName ? `The traveller's name is ${body.userName}.` : null,
          body.location
            ? `Their current coordinates are ${body.location.lat.toFixed(4)}, ${body.location.lng.toFixed(4)} — you may call guide_me without asking for location again.`
            : "Their live location is not shared.",
          `Current time in Mumbai: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.`,
          body.pageContext ?? null,
        ]
          .filter(Boolean)
          .join(" ");

        try {
          const result = streamText({
            model: gateway("google/gemini-3.8-flash"),
            system: `${SYSTEM}\n\n${contextLine}`,
            messages: await convertToModelMessages(body.messages),
            tools,
            stopWhen: stepCountIs(4),
            // No thinking budget + priority serving = much snappier replies.
            providerOptions: {
              lovable: {
                reasoning_effort: "none",
                service_tier: "priority",
              },
            },
            abortSignal: request.signal,
          });

          return result.toUIMessageStreamResponse({
            originalMessages: body.messages,
            onError: (error) => {
              console.error("chat stream failed", error);
              return error instanceof Error ? error.message : String(error);
            },
          });
        } catch (error) {
          console.error("chat route failed", error);
          return new Response(
            JSON.stringify({ error: "The assistant could not answer right now." }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
