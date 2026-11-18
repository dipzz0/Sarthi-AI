import { createFileRoute } from "@tanstack/react-router";

import { requireLovableApiKey } from "@/lib/ai-gateway.server";

const MAX_BYTES = 14 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let apiKey: string;
        try {
          apiKey = requireLovableApiKey();
        } catch {
          return Response.json({ error: "Voice input is not configured." }, { status: 500 });
        }

        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File)) {
          return Response.json({ error: "No audio received." }, { status: 400 });
        }
        if (file.size < 2048) {
          return Response.json(
            { error: "That recording was empty — please record again." },
            { status: 400 },
          );
        }
        if (file.size > MAX_BYTES) {
          return Response.json({ error: "Recording is too long." }, { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", "google/gemini-3.5-transcribe");
        upstream.append("file", file, "recording.wav");

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Lovable-API-Key": apiKey },
          body: upstream,
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          console.error("transcription failed", response.status, detail);
          return Response.json(
            { error: "Could not understand that recording.", detail },
            { status: response.status },
          );
        }

        const data = (await response.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
