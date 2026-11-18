import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const VISION_MODEL = "google/gemini-3.8-flash";

export interface Detection {
  label: string;
  severity: "low" | "medium" | "high";
  note: string;
}

export interface SceneReport {
  headline: string;
  summary: string;
  category: string;
  detections: Detection[];
}

function key() {
  const k = process.env["LOVABLE_API_KEY"];
  if (!k) throw new Error("AI service is not configured.");
  return k;
}

function parseReport(text: string): SceneReport {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    const raw = JSON.parse(slice) as Partial<SceneReport>;
    return {
      headline: String(raw.headline ?? "Scene analysed"),
      summary: String(raw.summary ?? cleaned.slice(0, 400)),
      category: String(raw.category ?? "Other"),
      detections: Array.isArray(raw.detections)
        ? raw.detections.slice(0, 6).map((d) => ({
            label: String((d as Detection).label ?? "Observation"),
            severity: (["low", "medium", "high"] as const).includes(
              (d as Detection).severity,
            )
              ? (d as Detection).severity
              : "low",
            note: String((d as Detection).note ?? ""),
          }))
        : [],
    };
  } catch {
    return {
      headline: "Scene analysed",
      summary: cleaned.slice(0, 400) || "No readable analysis returned.",
      category: "Other",
      detections: [],
    };
  }
}

async function callVision(parts: unknown[], system: string): Promise<SceneReport> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key()}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: parts },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Too many requests. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits have been used up.");
    throw new Error(`Analysis failed (${res.status}). ${body.slice(0, 160)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parseReport(json.choices?.[0]?.message?.content ?? "");
}

const ROAD_SYSTEM = `You are a road and transit condition detector for an Indian city transport app.
Look at the frame and report only what is actually visible.
Detect things like: potholes / broken road, traffic congestion, waterlogging or flooded/closed stretch due to rain,
road blockage or construction, crowding at a stop/platform, overturned or broken-down vehicle, garbage or obstruction,
poor lighting, unsafe pedestrian conditions.
Reply with ONLY JSON:
{"headline":"max 6 words","summary":"2 short sentences, plain English","category":"Road damage|Traffic|Waterlogging|Blockage|Crowding|Safety|Clear","detections":[{"label":"short label","severity":"low|medium|high","note":"max 12 words"}]}
If the scene is clear, return category "Clear" with an empty detections array.`;

const COMPLAINT_SYSTEM = `You are a complaint intake assistant for an Indian public transport app (bus, auto-rickshaw, train).
From the user's spoken/typed words and any attached photo or video, write a clear, factual complaint.
Reply with ONLY JSON:
{"headline":"max 7 words","summary":"the complaint rewritten formally in 2-3 sentences","category":"Overcharging|Delay|Cleanliness|Staff behaviour|Lost luggage|Refund pending|Safety|Other","detections":[{"label":"evidence or key fact","severity":"low|medium|high","note":"max 12 words"}]}
Never invent facts that are not stated or visible.`;

const MediaInput = z.object({
  dataUrl: z.string().min(24),
  kind: z.enum(["image", "video"]),
  note: z.string().max(2000).optional(),
});

/** Real-time-ish road/scene detection from a captured camera frame or clip. */
export const analyzeScene = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MediaInput.parse(d))
  .handler(async ({ data }) => {
    const media =
      data.kind === "video"
        ? { type: "video_url", video_url: { url: data.dataUrl } }
        : { type: "image_url", image_url: { url: data.dataUrl } };
    return callVision(
      [{ type: "text", text: data.note?.trim() || "Analyse this scene." }, media],
      ROAD_SYSTEM,
    );
  });

const ComplaintInput = z.object({
  text: z.string().max(4000).optional(),
  dataUrl: z.string().optional(),
  kind: z.enum(["image", "video"]).optional(),
});

/** Turns typed/spoken words plus optional photo or video into a structured complaint. */
export const draftComplaint = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ComplaintInput.parse(d))
  .handler(async ({ data }) => {
    const parts: unknown[] = [
      { type: "text", text: data.text?.trim() || "Describe the problem visible in the attachment." },
    ];
    if (data.dataUrl && data.kind) {
      parts.push(
        data.kind === "video"
          ? { type: "video_url", video_url: { url: data.dataUrl } }
          : { type: "image_url", image_url: { url: data.dataUrl } },
      );
    }
    return callVision(parts, COMPLAINT_SYSTEM);
  });

const AudioInput = z.object({
  audioBase64: z.string().min(32),
  fileName: z.string().default("recording.webm"),
});

/** Speech to text for spoken complaints. */
export const transcribeComplaint = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AudioInput.parse(d))
  .handler(async ({ data }) => {
    const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const form = new FormData();
    form.append("model", "google/gemini-3.5-transcribe");
    form.append("file", new Blob([bytes]), data.fileName);

    const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Transcription failed (${res.status}). ${body.slice(0, 160)}`);
    }
    const json = (await res.json()) as { text?: string };
    return { text: json.text ?? "" };
  });
