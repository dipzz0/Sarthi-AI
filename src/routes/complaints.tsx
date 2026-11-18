import { createFileRoute } from "@tanstack/react-router";
import { requireAccount } from "@/lib/require-auth";
import {
  Bus,
  CheckCircle2,
  ClipboardList,
  FileText,
  Keyboard,
  Loader2,
  Mic,
  MessageSquareWarning,
  ScanEye,
  Send,
  Sparkles,
  Square,
  Tag,
  Trash2,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";
import { AppScreen, SectionHeading, TabBar } from "@/components/site-chrome";
import { COMPLAINT_CATEGORIES, SERVICES } from "@/lib/transit-data";
import { addComplaint, makeId, nowLabel, useTransitState } from "@/lib/transit-store";
import { draftComplaint, transcribeComplaint, type SceneReport } from "@/lib/vision.functions";

export const Route = createFileRoute("/complaints")({
  ssr: false,
  beforeLoad: requireAccount,
  head: () => ({
    meta: [
      { title: "Register a Complaint — Sarthi AI" },
      {
        name: "description",
        content:
          "File a transit complaint by typing, speaking or uploading a video. AI reads your evidence, drafts the complaint and tracks it from new to resolved.",
      },
      { property: "og:title", content: "Register a Complaint — Sarthi AI" },
      {
        property: "og:description",
        content: "Type, speak or upload a video — AI files and tracks your transit complaint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComplaintsPage,
});

const STATUS_STYLE: Record<string, string> = {
  New: "bg-sunset/15 text-sunset",
  "In review": "bg-gold/25 text-ink",
  Resolved: "bg-rail/15 text-rail",
};

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-rail/15 text-rail",
  medium: "bg-gold/30 text-ink",
  high: "bg-sunset/15 text-sunset",
};

const MODES = [
  { id: "type", label: "Type", icon: Keyboard },
  { id: "speak", label: "Speak", icon: Mic },
  { id: "video", label: "Video", icon: Video },
] as const;

type InputMode = (typeof MODES)[number]["id"];

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function ComplaintsPage() {
  const { complaints } = useTransitState();
  const [mode, setMode] = useState<InputMode>("type");
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0]!);
  const [service, setService] = useState(SERVICES[0]!.number);
  const [detail, setDetail] = useState("");
  const [filed, setFiled] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<null | "voice" | "ai">(null);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<{ url: string; kind: "image" | "video"; name: string } | null>(
    null,
  );
  const [report, setReport] = useState<SceneReport | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 2048) {
          setError("The recording was too short. Please try again.");
          return;
        }
        setBusy("voice");
        try {
          const dataUrl = await fileToDataUrl(blob);
          const base64 = dataUrl.split(",")[1] ?? "";
          const ext = (recorder.mimeType || "audio/webm").includes("mp4") ? "mp4" : "webm";
          const res = await transcribeComplaint({
            data: { audioBase64: base64, fileName: `complaint.${ext}` },
          });
          setDetail((prev) => (prev ? `${prev} ${res.text}`.trim() : res.text.trim()));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Voice could not be processed.");
        } finally {
          setBusy(null);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access is required. Allow browser permission and try again.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  async function onPickMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (file.size > 12 * 1024 * 1024) {
      setError("The file must be smaller than 12 MB.");
      return;
    }
    const url = await fileToDataUrl(file);
    setMedia({
      url,
      kind: file.type.startsWith("video") ? "video" : "image",
      name: file.name,
    });
  }

  async function runAi() {
    if (!detail.trim() && !media) {
      setError("Type or record a description, or attach a video.");
      return;
    }
    setError(null);
    setBusy("ai");
    try {
      const res = await draftComplaint({
        data: {
          text: detail.trim() || undefined,
          ...(media ? { dataUrl: media.url, kind: media.kind } : {}),
        },
      });
      setReport(res);
      setDetail(res.summary);
      if (COMPLAINT_CATEGORIES.includes(res.category)) setCategory(res.category);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI could not read this.");
    } finally {
      setBusy(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (detail.trim().length < 8) {
      setError("Please add more detail (at least 8 characters).");
      return;
    }
    const id = makeId("C");
    addComplaint({
      id,
      category,
      service,
      detail: detail.trim(),
      status: "New",
      filedAt: nowLabel(),
    });
    setDetail("");
    setMedia(null);
    setReport(null);
    setError(null);
    setFiled(id);
  }

  return (
    <>
      <AppScreen title="Complaints" subtitle="First response · 6 working hours" back>
        <form
          onSubmit={submit}
          className="board-surface animate-rise space-y-4 rounded-2xl p-4 sm:p-6"
        >
          <SectionHeading
            icon={MessageSquareWarning}
            title="New complaint"
            hint="Type · Speak · Video — AI will draft it"
          />

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-parchment p-1.5 ring-1 ring-black/5">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={
                    active
                      ? "flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2.5 font-mono text-[10px] tracking-wider text-parchment uppercase"
                      : "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-mono text-[10px] tracking-wider text-ink-soft uppercase transition-colors hover:text-ink"
                  }
                >
                  <Icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>

          {mode === "speak" ? (
            <div className="animate-rise rounded-2xl bg-parchment p-4 ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className={
                    recording
                      ? "animate-sosring grid size-14 shrink-0 place-items-center rounded-full bg-sunset text-on-sunset"
                      : "grid size-14 shrink-0 place-items-center rounded-full bg-ink text-parchment transition-transform active:scale-95"
                  }
                  aria-label={recording ? "Stop recording" : "Start recording"}
                >
                  {recording ? <Square size={18} /> : <Mic size={20} />}
                </button>
                <div className="min-w-0">
                  <div className="font-display text-lg tracking-tight">
                    {recording ? "Listening…" : "Describe your complaint by voice"}
                  </div>
                  <div className="font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                    {busy === "voice" ? "Converting speech to text…" : "Speak clearly after pressing the microphone"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {mode === "video" ? (
            <div className="animate-rise space-y-3 rounded-2xl bg-parchment p-4 ring-1 ring-black/5">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-parchment">
                  <Video size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg tracking-tight">
                    Upload a video or photo
                  </span>
                  <span className="block font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                    Maximum 12 MB · AI will review the evidence
                  </span>
                </span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  capture="environment"
                  onChange={onPickMedia}
                  className="sr-only"
                />
              </label>

              {media ? (
                <div className="flex items-center gap-3 rounded-xl bg-parchment-2 p-3">
                  {media.kind === "video" ? (
                    <video src={media.url} className="size-16 rounded-lg object-cover" muted />
                  ) : (
                    <img src={media.url} alt="Complaint evidence" className="size-16 rounded-lg object-cover" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-soft">
                    {media.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMedia(null)}
                    aria-label="Remove attachment"
                    className="grid size-9 place-items-center rounded-full bg-parchment text-ink-soft transition-colors hover:text-sunset"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              <Tag size={12} /> Category
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMPLAINT_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={
                    category === c
                      ? "rounded-full bg-ink px-4 py-2 font-mono text-[10px] tracking-wider text-parchment uppercase"
                      : "rounded-full bg-parchment px-4 py-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase ring-1 ring-black/5 transition-colors hover:text-ink"
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              <Bus size={12} /> Service
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="mt-2 w-full rounded-xl bg-parchment px-4 py-3 text-sm ring-1 ring-black/5 outline-none focus:ring-sunset"
            >
              {SERVICES.map((s) => (
                <option key={s.id} value={s.number}>
                  {s.number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-ink-soft uppercase">
              <FileText size={12} /> What happened
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder="Describe the issue, time and place…"
              className="mt-2 w-full resize-none rounded-xl bg-parchment px-4 py-3 text-sm ring-1 ring-black/5 outline-none placeholder:text-ink-soft focus:ring-sunset"
            />
          </div>

          <button
            type="button"
            onClick={runAi}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-parchment transition-opacity disabled:opacity-60"
          >
            {busy === "ai" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {busy === "ai" ? "AI reading your evidence…" : "AI se complaint likhwayein"}
          </button>

          {report ? (
            <div className="animate-rise space-y-3 rounded-2xl bg-parchment p-4 ring-1 ring-black/5">
              <SectionHeading icon={ScanEye} title="AI reading" hint={report.category} />
              <div className="font-display text-lg tracking-tight">{report.headline}</div>
              {report.detections.map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px] tracking-wider uppercase ${SEVERITY_STYLE[d.severity]}`}
                  >
                    {d.severity}
                  </span>
                  <span className="min-w-0 text-sm text-ink/80">
                    <b className="font-semibold">{d.label}</b>
                    {d.note ? ` — ${d.note}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {error ? (
            <p className="font-mono text-[11px] text-sunset">{error}</p>
          ) : null}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sunset py-3.5 text-sm font-semibold text-on-sunset shadow-sunset transition-colors hover:bg-sunset-soft active:scale-[0.99]"
          >
            <Send size={16} /> File complaint
          </button>

          {filed ? (
            <p className="animate-rise flex items-center gap-2 font-mono text-[11px] text-rail">
              <CheckCircle2 size={14} /> Filed · reference {filed}. Status niche dikh raha hai.
            </p>
          ) : null}
        </form>

        <section className="space-y-3">
          <SectionHeading
            icon={ClipboardList}
            title="Your case file"
            hint={`${complaints.length} total`}
          />
          {complaints.map((c) => (
            <div
              key={c.id}
              className="animate-rise rounded-2xl bg-parchment-2 p-4 ring-1 ring-black/5 transition-shadow hover:shadow-panel"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="font-display truncate text-lg tracking-tight">{c.category}</div>
                  <div className="truncate font-mono text-[11px] text-ink-soft">
                    {c.id} · {c.service} · {c.filedAt}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-mono text-[10px] tracking-wider uppercase ${STATUS_STYLE[c.status]}`}
                >
                  {c.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-ink/80">{c.detail}</p>
            </div>
          ))}
        </section>
      </AppScreen>
      <TabBar />
    </>
  );
}
