import { createFileRoute } from "@tanstack/react-router";
import { requireAccount } from "@/lib/require-auth";
import {
  CameraOff,
  CircleDot,
  Construction,
  Droplets,
  Loader2,
  Radar,
  ScanEye,
  ShieldCheck,
  TrafficCone,
  Upload,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppScreen, SectionHeading, TabBar } from "@/components/site-chrome";
import { analyzeScene, type SceneReport } from "@/lib/vision.functions";

export const Route = createFileRoute("/scan")({
  ssr: false,
  beforeLoad: requireAccount,
  head: () => ({
    meta: [
      { title: "Road Scan — Live Condition Detection | Sarthi AI" },
      {
        name: "description",
        content:
          "Point your camera at the road and Sarthi AI detects potholes, traffic jams, waterlogged or blocked stretches and crowding in real time.",
      },
      { property: "og:title", content: "Road Scan — Live Condition Detection" },
      {
        property: "og:description",
        content: "Real-time pothole, traffic and waterlogging detection from your camera.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanPage,
});

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-rail/15 text-rail",
  medium: "bg-gold/30 text-ink",
  high: "bg-sunset/15 text-sunset",
};

const LEGEND = [
  { icon: Construction, label: "Potholes / broken road" },
  { icon: TrafficCone, label: "Traffic congestion" },
  { icon: Droplets, label: "Waterlogging & closures" },
  { icon: ShieldCheck, label: "Crowding & safety" },
];

function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);

  const [live, setLive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<SceneReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      setError("Camera permission is required. Allow access and try again.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
    setScanning(false);
  }

  function grabFrame(): string | null {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const width = 640;
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.6);
  }

  async function detectOnce(dataUrl?: string, kind: "image" | "video" = "image") {
    const media = dataUrl ?? grabFrame();
    if (!media) return;
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await analyzeScene({ data: { dataUrl: media, kind } });
      setReport(res);
      setLastAt(
        new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(
          new Date(),
        ),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
      setScanning(false);
    } finally {
      busyRef.current = false;
    }
  }

  // Continuous "real-time" detection loop while scanning is on.
  useEffect(() => {
    if (!scanning || !live) return;
    void detectOnce();
    const id = window.setInterval(() => void detectOnce(), 6000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, live]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setError("The file must be smaller than 12 MB.");
      return;
    }
    const url = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    setError(null);
    await detectOnce(url, file.type.startsWith("video") ? "video" : "image");
  }

  return (
    <>
      <AppScreen title="Road Scan" subtitle="Vision model · live conditions" back>
        <section className="board-surface animate-rise space-y-4 rounded-2xl p-4 sm:p-6">
          <SectionHeading icon={ScanEye} title="Live detection" hint="Check nearby conditions with your camera" />

          <div className="relative overflow-hidden rounded-2xl bg-ink">
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-[4/3] w-full object-cover"
            />
            {!live ? (
              <div className="absolute inset-0 grid place-items-center gap-2 text-parchment/70">
                <CameraOff size={26} />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Camera off</span>
              </div>
            ) : null}
            {live && scanning ? (
              <div className="pointer-events-none absolute inset-3 rounded-xl border border-gold/60">
                <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[9px] tracking-wider text-parchment uppercase">
                  <span className="animate-livepulse size-1.5 rounded-full bg-rail" /> detecting
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={live ? stopCamera : startCamera}
              className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-parchment active:scale-[0.99]"
            >
              <Video size={16} /> {live ? "Stop camera" : "Start camera"}
            </button>
            <button
              type="button"
              disabled={!live}
              onClick={() => setScanning((s) => !s)}
              className="flex items-center justify-center gap-2 rounded-xl bg-sunset py-3 text-sm font-semibold text-on-sunset shadow-sunset disabled:opacity-50 active:scale-[0.99]"
            >
              {scanning ? <Loader2 size={16} className="animate-spin" /> : <CircleDot size={16} />}
              {scanning ? "Scanning…" : "Detect live"}
            </button>
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-parchment py-3 font-mono text-[10px] tracking-wider text-ink-soft uppercase ring-1 ring-black/5 transition-colors hover:text-ink">
            <Upload size={14} /> Upload a photo or video to check
            <input type="file" accept="video/*,image/*" onChange={onUpload} className="sr-only" />
          </label>

          {error ? <p className="font-mono text-[11px] text-sunset">{error}</p> : null}
        </section>

        <section className="animate-rise space-y-3 rounded-2xl bg-parchment-2 p-4 ring-1 ring-black/5">
          <SectionHeading
            icon={Radar}
            title="Detection report"
            hint={lastAt ? `Updated ${lastAt}` : "No scans yet"}
          />
          {report ? (
            <>
              <div className="font-display text-xl tracking-tight">{report.headline}</div>
              <p className="text-sm text-ink/80">{report.summary}</p>
              <div className="space-y-2">
                {report.detections.length === 0 ? (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-rail">
                    <ShieldCheck size={14} /> Road clear — no hazards detected.
                  </div>
                ) : (
                  report.detections.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl bg-parchment p-3 ring-1 ring-black/5"
                    >
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
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink/70">
              Turn on the camera and press “Detect live”. The app will report road conditions every few seconds.
            </p>
          )}
        </section>

        <section className="grid grid-cols-2 gap-2">
          {LEGEND.map((l) => {
            const Icon = l.icon;
            return (
              <div
                key={l.label}
                className="flex items-center gap-2 rounded-xl bg-parchment-2 p-3 ring-1 ring-black/5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-parchment text-sunset ring-1 ring-black/5">
                  <Icon size={15} />
                </span>
                <span className="min-w-0 truncate font-mono text-[10px] tracking-wider text-ink-soft uppercase">
                  {l.label}
                </span>
              </div>
            );
          })}
        </section>
      </AppScreen>
      <TabBar />
    </>
  );
}
