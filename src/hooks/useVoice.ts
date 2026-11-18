import { useCallback, useRef, useState } from "react";

/** Encode captured PCM chunks into a 16-bit mono WAV file at 16 kHz. */
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const target = 16000;
  const merged = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  const ratio = sampleRate / target;
  const outLength = Math.floor(merged.length / ratio);
  const samples = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const s = merged[Math.floor(i * ratio)] ?? 0;
    const clamped = Math.max(-1, Math.min(1, s));
    samples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);

  return new Blob([buffer], { type: "audio/wav" });
}

interface Recorder {
  stream: MediaStream;
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode;
  node: ScriptProcessorNode;
  chunks: Float32Array[];
}

export function useVoiceRecorder() {
  const recorder = useRef<Recorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (options?: { onSilence?: () => void }) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      let heardSpeech = false;
      let quietSamples = 0;
      let done = false;
      node.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(input));
        let peak = 0;
        for (let i = 0; i < input.length; i += 32) peak = Math.max(peak, Math.abs(input[i] ?? 0));
        setLevel(peak);

        if (!options?.onSilence || done) return;
        const frameSeconds = input.length / ctx.sampleRate;
        if (peak > 0.045) {
          heardSpeech = true;
          quietSamples = 0;
        } else if (heardSpeech) {
          quietSamples += frameSeconds;
          if (quietSamples > 1.1) {
            done = true;
            options.onSilence();
          }
        }
      };
      source.connect(node);
      node.connect(ctx.destination);
      recorder.current = { stream, ctx, source, node, chunks };
      setRecording(true);
      return true;
    } catch {
      setError("Microphone permission is needed to record.");
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const r = recorder.current;
    recorder.current = null;
    setRecording(false);
    setLevel(0);
    if (!r) return null;
    r.stream.getTracks().forEach((t) => t.stop());
    r.node.disconnect();
    r.source.disconnect();
    const blob = encodeWav(r.chunks, r.ctx.sampleRate);
    await r.ctx.close().catch(() => {});
    if (blob.size < 2048) {
      setError("That recording was empty — please try again.");
      return null;
    }
    return blob;
  }, []);

  const cancel = useCallback(async () => {
    const r = recorder.current;
    recorder.current = null;
    setRecording(false);
    setLevel(0);
    if (!r) return;
    r.stream.getTracks().forEach((t) => t.stop());
    r.node.disconnect();
    r.source.disconnect();
    await r.ctx.close().catch(() => {});
  }, []);

  return { start, stop, cancel, recording, level, error, setError };
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "recording.wav");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Could not understand that recording.");
  return (data.text ?? "").trim();
}

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export const VOICE_OPTIONS = [
  { id: "priya", label: "Priya (female)" },
  { id: "meera", label: "Meera (female)" },
  { id: "arjun", label: "Arjun (male)" },
  { id: "rohan", label: "Rohan (male)" },
] as const;

export async function speakText(text: string, voice = "priya"): Promise<void> {
  stopSpeaking();
  const res = await fetch("/api/speak", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error("Could not play the voice reply.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  await new Promise<void>((resolve) => {
    const finish = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.onpause = () => {
      if (currentAudio !== audio) finish();
    };
    audio.play().catch(finish);
  });
}
