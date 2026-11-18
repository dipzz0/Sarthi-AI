import { createFileRoute } from "@tanstack/react-router";

import { requireLovableApiKey } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let apiKey: string;
        try {
          apiKey = requireLovableApiKey();
        } catch {
          return Response.json({ error: "Voice replies are not configured." }, { status: 500 });
        }

        const body = (await request.json().catch(() => null)) as
          | { text?: string; voice?: string }
          | null;
        const text = body?.text?.trim();
        if (!text) return Response.json({ error: "Nothing to read out." }, { status: 400 });

        // Female-sounding: coral, nova, shimmer, sage. Male-sounding: ash, onyx, verse, alloy.
        const VOICES: Record<string, { id: string; persona: string }> = {
          priya: {
            id: "coral",
            persona:
              "a warm, friendly young Indian woman from Mumbai — soft, bright and reassuring",
          },
          meera: {
            id: "shimmer",
            persona:
              "a calm, elegant Indian woman — measured, polite and professional, like a senior concierge",
          },
          arjun: {
            id: "ash",
            persona:
              "a friendly young Indian man from Mumbai — easy-going and confident",
          },
          rohan: {
            id: "verse",
            persona: "a steady, mature Indian man — calm, clear and dependable",
          },
        };
        const picked = VOICES[(body?.voice ?? "priya").toLowerCase()] ?? VOICES["priya"]!;

        // Strip markdown so the voice never reads out symbols.
        const clean = text
          .replace(/```[\s\S]*?```/g, " ")
          .replace(/[*_`#>]+/g, "")
          .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
          .replace(/^\s*[-•]\s*/gm, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: clean.slice(0, 3500),
            voice: picked.id,
            response_format: "mp3",
            instructions: `You are ${picked.persona}. Speak clear, natural Indian English exactly as written, with a gentle Mumbai accent. Be conversational and human, with a brisk but comfortable pace, brief pauses, and a warm tone. Say numbers, times and fares naturally.`,
          }),
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          console.error("speech failed", response.status, detail);
          return Response.json({ error: "Could not generate the voice reply." }, { status: response.status });
        }

        return new Response(response.body, {
          headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
        });
      },
    },
  },
});
