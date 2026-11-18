import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  VOICE_OPTIONS,
  speakText,
  stopSpeaking,
  transcribeAudio,
  useVoiceRecorder,
} from "@/hooks/useVoice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "Sarthi assistant — Sarthi AI" },
      {
        name: "description",
        content:
          "Talk or type to Sarthi: plan Mumbai journeys, find stays, get unlost and draft transport complaints.",
      },
      { property: "og:title", content: "Sarthi assistant — Sarthi AI" },
      {
        property: "og:description",
        content: "Your Mumbai voice travel assistant for trains, metro, buses, autos and stays.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "What is the fastest route from Andheri to CSMT?",
  "Find hotels near Bandra for up to ₹3,000",
  "What are the first and last Aqua Line train times?",
  "The auto driver overcharged me. Draft a complaint.",
];

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

type LiveState = "idle" | "listening" | "thinking" | "speaking";

function AssistantPage() {
  const { displayName } = useAuth();
  const recorder = useVoiceRecorder();
  const [input, setInput] = useState("");
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [voice, setVoice] = useState<string>("priya");
  const voiceRef = useRef("priya");
  voiceRef.current = voice;
  const [transcribing, setTranscribing] = useState(false);
  const [live, setLive] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>("idle");
  const liveRef = useRef(false);
  const turnRef = useRef<() => void>(() => {});
  const spoken = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: msgs }) => ({
        body: { messages: msgs, userName: displayName, location: null },
      }),
    }),
    onError: (err) => toast.error(err.message || "The assistant could not respond right now."),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    stopSpeaking();
    setInput("");
    sendMessage({ text: trimmed });
  };

  const startListening = async () => {
    stopSpeaking();
    setLiveState("listening");
    const ok = await recorder.start({ onSilence: () => turnRef.current() });
    if (!ok) {
      liveRef.current = false;
      setLive(false);
      setLiveState("idle");
      toast.error(recorder.error ?? "Microphone permission is required.");
    }
  };

  // Voice turn: stop recording, transcribe, and send to Sarthi.
  turnRef.current = async () => {
    if (!recorder.recording) return;
    setLiveState("thinking");
    const blob = await recorder.stop();
    if (!blob) {
      if (liveRef.current) void startListening();
      return;
    }
    setTranscribing(true);
    try {
      const text = await transcribeAudio(blob);
      if (text) send(text);
      else if (liveRef.current) void startListening();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transcription failed");
      if (liveRef.current) void startListening();
    } finally {
      setTranscribing(false);
    }
  };

  useEffect(() => {
    if (busy) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    const text = textOf(last);
    if (!text || spoken.current === last.id) return;
    spoken.current = last.id;
    if (!voiceReplies && !liveRef.current) return;
    setLiveState("speaking");
    speakText(text, voiceRef.current)
      .catch(() => {})
      .finally(() => {
        if (liveRef.current) void startListening();
        else setLiveState("idle");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, busy, voiceReplies]);

  useEffect(
    () => () => {
      liveRef.current = false;
      stopSpeaking();
      void recorder.cancel();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggleLive = async () => {
    if (liveRef.current) {
      liveRef.current = false;
      setLive(false);
      setLiveState("idle");
      stopSpeaking();
      await recorder.cancel();
      return;
    }
    liveRef.current = true;
    setLive(true);
    await startListening();
  };

  const toggleRecord = async () => {
    if (liveRef.current) {
      await turnRef.current();
      return;
    }
    if (recorder.recording) {
      await turnRef.current();
    } else {
      stopSpeaking();
      await recorder.start();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xs tracking-[0.25em] text-primary uppercase">Assistant</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Sarthi</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={voice}
            onChange={(e) => {
              stopSpeaking();
              setVoice(e.target.value);
            }}
            aria-label="Voice"
            className="h-9 rounded-xl border border-border/60 bg-secondary px-3 text-sm"
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              if (voiceReplies) stopSpeaking();
              setVoiceReplies((v) => !v);
            }}
          >
            {voiceReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceReplies ? "Voice replies on" : "Voice replies off"}
          </Button>
          <Button variant={live ? "destructive" : "hero"} size="sm" onClick={toggleLive}>
            {live ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {live ? "End live talk" : "Live talk"}
          </Button>
        </div>
      </header>

      {live && (
        <div className="surface-panel mt-4 flex items-center gap-3 p-4">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15"
            style={{ transform: `scale(${1 + Math.min(recorder.level * 2, 0.6)})` }}
          >
            <Mic className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-medium">
              {liveState === "listening"
                ? "Listening… please speak"
                : liveState === "thinking"
                  ? "Thinking…"
                  : liveState === "speaking"
                    ? "Responding…"
                    : "Live talk on"}
            </p>
            <p className="text-xs text-muted-foreground">
               Your message is sent automatically when you stop speaking. It works hands-free.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex-1 space-y-4">
        {messages.length === 0 && (
          <div className="surface-panel p-6">
            <p className="text-sm text-muted-foreground">
               Ask about routes, hotels, line timings, or complaints. You can type or speak.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xl border border-border/60 px-3 py-2.5 text-left text-sm transition hover:bg-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = textOf(m);
          const tools = m.parts.filter((p) => p.type.startsWith("tool-"));
          return (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "surface-panel text-foreground",
                )}
              >
                {tools.length > 0 && m.role !== "user" && !text && (
                  <p className="text-xs text-muted-foreground">Checking Mumbai network data…</p>
                )}
                {text}
              </div>
            </div>
          );
        })}

        {busy && <p className="text-xs text-muted-foreground">Sarthi is preparing a response…</p>}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <div ref={bottom} />
      </div>

      <form
        className="surface-panel sticky bottom-20 mt-6 flex items-end gap-2 p-3 lg:bottom-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Button
          type="button"
          variant={recorder.recording ? "destructive" : "soft"}
          size="icon"
          onClick={toggleRecord}
          disabled={transcribing}
          aria-label={recorder.recording ? "Stop recording" : "Start recording"}
        >
          {recorder.recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder={transcribing ? "Transcribing…" : "Type here or press the microphone…"}
          className="min-h-10 resize-none border-0 bg-transparent focus-visible:ring-0"
        />
        {busy ? (
          <Button type="button" size="icon" variant="soft" onClick={stop} aria-label="Stop">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
