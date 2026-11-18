import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Mic, MessageCircle, Send, Square, X } from "lucide-react";
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

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

type LiveState = "idle" | "listening" | "thinking" | "speaking";

interface VoiceAgentProps {
  /** Which section the traveller is on, e.g. "Journey planner". */
  section: string;
  /** What this section can do — helps the assistant stay on point. */
  context: string;
  suggestions?: string[];
}

export function VoiceAgent({ section, context, suggestions = [] }: VoiceAgentProps) {
  const { displayName } = useAuth();
  const recorder = useVoiceRecorder();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState("priya");
  const [live, setLive] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>("idle");
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const liveRef = useRef(false);
  const turnRef = useRef<() => void>(() => {});
  const spoken = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: msgs }) => ({
        body: {
          messages: msgs,
          userName: displayName,
          location: null,
          pageContext: `The traveller is on the "${section}" section. ${context}`,
        },
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

  turnRef.current = async () => {
    if (!recorder.recording) return;
    setLiveState("thinking");
    const blob = await recorder.stop();
    if (!blob) {
      if (liveRef.current) void startListening();
      return;
    }
    try {
      const text = await transcribeAudio(blob);
      if (text) send(text);
      else if (liveRef.current) void startListening();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transcription failed");
      if (liveRef.current) void startListening();
    }
  };

  useEffect(() => {
    if (busy) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    const text = textOf(last);
    if (!text || spoken.current === last.id) return;
    spoken.current = last.id;
    if (!liveRef.current) return;
    setLiveState("speaking");
    speakText(text, voiceRef.current)
      .catch(() => {})
      .finally(() => {
        if (liveRef.current) void startListening();
        else setLiveState("idle");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, busy]);

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
    if (liveRef.current || recorder.recording) {
      await turnRef.current();
      return;
    }
    stopSpeaking();
    await recorder.start();
  };

  if (!open) {
    return (
      <Button
        variant="hero"
        size="lg"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-24 z-40 rounded-full shadow-lg lg:bottom-6"
      >
        <MessageCircle className="h-4 w-4" />
        Sarthi
      </Button>
    );
  }

  return (
    <div className="surface-panel fixed right-4 bottom-24 z-40 flex h-[min(32rem,70vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden lg:bottom-6">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Sarthi</p>
          <p className="text-xs text-muted-foreground">{section}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={voice}
            onChange={(e) => {
              stopSpeaking();
              setVoice(e.target.value);
            }}
            aria-label="Voice"
            className="h-8 rounded-lg border border-border/60 bg-secondary px-2 text-xs"
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <Button
            variant={live ? "destructive" : "soft"}
            size="icon"
            onClick={toggleLive}
            aria-label={live ? "End live talk" : "Live talk"}
          >
            {live ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              liveRef.current = false;
              setLive(false);
              stopSpeaking();
              void recorder.cancel();
              setOpen(false);
            }}
            aria-label="Close assistant"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {live
                ? "I’m listening — please speak."
                : "Ask a question or press the microphone. You’ll receive a focused answer."}
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="w-full rounded-xl border border-border/60 px-3 py-2 text-left text-xs transition hover:bg-secondary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => {
          const text = textOf(m);
          if (!text) return null;
          return (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground",
                )}
              >
                {text}
              </div>
            </div>
          );
        })}

        {live && (
          <p className="text-xs text-primary">
            {liveState === "listening"
              ? "Listening…"
              : liveState === "thinking"
                ? "Thinking…"
                : liveState === "speaking"
                  ? "Responding…"
                  : "Live talk on"}
          </p>
        )}
        {busy && !live && <p className="text-xs text-muted-foreground">Sarthi is preparing a response…</p>}
        {error && <p className="text-xs text-destructive">{error.message}</p>}
        <div ref={bottom} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-border/60 p-3"
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
          placeholder="Type here or press the microphone…"
          className="min-h-9 resize-none border-0 bg-transparent focus-visible:ring-0"
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
