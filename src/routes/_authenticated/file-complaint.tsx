import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { VoiceAgent } from "@/components/voice-agent";
import { Mic, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { transcribeAudio, useVoiceRecorder } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/file-complaint")({
  head: () => ({
    meta: [
      { title: "Complaints — Sarthi AI" },
      {
        name: "description",
        content:
          "File a Mumbai transport complaint by voice or text — trains, metro, buses, autos and cabs — and track its status.",
      },
      { property: "og:title", content: "Complaints — Sarthi AI" },
      {
        property: "og:description",
        content: "Record your complaint, send it to the right authority and track the ticket.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComplaintsPage,
});

const CATEGORIES = [
  "Local train",
  "Metro",
  "Monorail",
  "Bus",
  "Auto rickshaw",
  "Cab",
  "Station",
  "Safety",
  "Other",
] as const;

function ComplaintsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const recorder = useVoiceRecorder();

  const [category, setCategory] = useState<string>("Local train");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [authority, setAuthority] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [location, setLocation] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const list = useQuery({
    queryKey: ["complaints", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, ticket_no, subject, description, category, authority, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleRecord = async () => {
    if (recorder.recording) {
      const blob = await recorder.stop();
      if (!blob) {
        toast.error(recorder.error ?? "The recording was empty.");
        return;
      }
      setAudio(blob);
      setTranscribing(true);
      try {
        const text = await transcribeAudio(blob);
        if (text) {
          setDescription((prev) => (prev ? `${prev}\n${text}` : text));
          if (!subject) setSubject(text.split(/[.!?]/)[0]?.slice(0, 80) ?? "Complaint");
          toast.success("Recording transcribed");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Transcription failed");
      } finally {
        setTranscribing(false);
      }
    } else {
      await recorder.start();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let audioPath: string | null = null;
      if (audio) {
        const path = `${user.id}/${Date.now()}.wav`;
        const { error: upErr } = await supabase.storage
          .from("complaint-audio")
          .upload(path, audio, { contentType: "audio/wav" });
        if (upErr) throw upErr;
        audioPath = path;
      }

      const { error } = await supabase.from("complaints").insert({
        user_id: user.id,
        category,
        subject: subject.trim(),
        description: description.trim(),
        authority: authority.trim() || null,
        vehicle_no: vehicleNo.trim() || null,
        location: location.trim() || null,
        audio_path: audioPath,
      });
      if (error) throw error;

      toast.success("Complaint filed");
      setSubject("");
      setDescription("");
      setAuthority("");
      setVehicleNo("");
      setLocation("");
      setAudio(null);
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The complaint could not be filed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="font-display text-xs tracking-[0.25em] text-primary uppercase">Complaints</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          File a complaint by voice
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Record your complaint for automatic transcription, or type it. Every complaint receives a ticket.
        </p>
      </header>

      <form className="surface-panel space-y-4 p-5" onSubmit={submit}>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={recorder.recording ? "destructive" : "soft"}
            onClick={toggleRecord}
            disabled={transcribing}
          >
            {recorder.recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {recorder.recording ? "Stop recording" : "Record complaint"}
          </Button>
          {recorder.recording && (
            <span className="text-xs text-muted-foreground">
               Listening… {Math.round(recorder.level * 100)}%
            </span>
          )}
          {transcribing && <span className="text-xs text-muted-foreground">Transcribing…</span>}
          {audio && !recorder.recording && (
            <span className="text-xs text-muted-foreground">Voice note attached</span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="authority">Authority (optional)</Label>
            <Input
              id="authority"
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              placeholder="Western Railway / BEST / MMRC"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Dirty coach on Borivali fast"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">What happened?</Label>
          <Textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, or record your complaint…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vehicle">Vehicle / train no. (optional)</Label>
            <Input
              id="vehicle"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="MH-01-AB-1234"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc">Location (optional)</Label>
            <Input
              id="loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Dadar platform 3"
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Filing…" : "File complaint"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Your complaints</h2>
        {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {list.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No complaints yet.</p>
        )}
        {list.data?.map((c) => (
          <article key={c.id} className="surface-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{c.subject}</h3>
              <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] text-primary">
                {c.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.ticket_no} · {c.category}
              {c.authority ? ` · ${c.authority}` : ""} ·{" "}
              {new Date(c.created_at).toLocaleDateString("en-IN")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
          </article>
        ))}
      </section>
          <VoiceAgent
        section="Complaints"
        context="This page files transport complaints. Help the traveller word a complaint and draft it for confirmation."
        suggestions={["The auto driver overcharged me. Draft a complaint.", "The train coach was dirty. Draft a complaint."]}
      />
    </div>
  );
}
