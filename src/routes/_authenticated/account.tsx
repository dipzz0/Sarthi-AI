import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, LogOut, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — Sarthi AI" },
      { name: "description", content: "Manage your Sarthi AI profile, travel preferences and account." },
      { property: "og:title", content: "Account — Sarthi AI" },
      { property: "og:description", content: "Manage your Sarthi AI profile and travel preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

type ProfileForm = {
  fullName: string;
  phone: string;
  homeCity: string;
  preferredMode: string;
  concession: string;
  emergencyName: string;
  emergencyNumber: string;
  notifyDelays: boolean;
  notifyOffers: boolean;
};

const EMPTY_PROFILE: ProfileForm = {
  fullName: "",
  phone: "",
  homeCity: "Mumbai",
  preferredMode: "train",
  concession: "none",
  emergencyName: "",
  emergencyNumber: "",
  notifyDelays: true,
  notifyOffers: false,
};

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteAccount = useServerFn(deleteMyAccount);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, phone, home_city, preferred_mode, concession, emergency_contact_name, emergency_contact_number, notify_delays, notify_offers")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error("Your profile could not be loaded.");
        if (data) {
          setProfile({
            fullName: data.full_name ?? "",
            phone: data.phone ?? "",
            homeCity: data.home_city ?? "Mumbai",
            preferredMode: data.preferred_mode ?? "train",
            concession: data.concession ?? "none",
            emergencyName: data.emergency_contact_name ?? "",
            emergencyNumber: data.emergency_contact_number ?? "",
            notifyDelays: data.notify_delays,
            notifyOffers: data.notify_offers,
          });
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.fullName.trim(),
        phone: profile.phone.trim(),
        home_city: profile.homeCity.trim(),
        preferred_mode: profile.preferredMode,
        concession: profile.concession,
        emergency_contact_name: profile.emergencyName.trim(),
        emergency_contact_number: profile.emergencyNumber.trim(),
        notify_delays: profile.notifyDelays,
        notify_offers: profile.notifyOffers,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Your changes could not be saved.");
      return;
    }
    toast.success("Account details saved");
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const removeAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut({ scope: "local" });
      toast.success("Your account has been deleted");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your account could not be deleted.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-primary uppercase">Settings</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep your personal and travel details up to date.</p>
        </div>
        <Button type="button" variant="outline" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </header>

      <form onSubmit={saveProfile} className="space-y-8">
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary"><UserRound size={18} /></span>
            <div><h2 className="font-display text-xl font-semibold">Personal details</h2><p className="text-sm text-muted-foreground">Used for your bookings and support requests.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="account-name">Full name</Label><Input id="account-name" value={profile.fullName} onChange={(e) => update("fullName", e.target.value)} disabled={loading} /></div>
            <div className="space-y-1.5"><Label htmlFor="account-email">Email</Label><Input id="account-email" value={user?.email ?? ""} disabled /></div>
            <div className="space-y-1.5"><Label htmlFor="account-phone">Phone</Label><Input id="account-phone" type="tel" value={profile.phone} onChange={(e) => update("phone", e.target.value)} disabled={loading} placeholder="Your phone number" /></div>
            <div className="space-y-1.5"><Label htmlFor="account-city">Home city</Label><Input id="account-city" value={profile.homeCity} onChange={(e) => update("homeCity", e.target.value)} disabled={loading} /></div>
          </div>
        </section>

        <section className="border-t border-border pt-7">
          <h2 className="font-display text-xl font-semibold">Travel preferences</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Preferred transport</Label><Select value={profile.preferredMode} onValueChange={(value) => update("preferredMode", value)} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="train">Train</SelectItem><SelectItem value="bus">Bus</SelectItem><SelectItem value="auto">Auto-rickshaw</SelectItem><SelectItem value="metro">Metro</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Fare concession</Label><Select value={profile.concession} onValueChange={(value) => update("concession", value)} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">General</SelectItem><SelectItem value="student">Student</SelectItem><SelectItem value="senior">Senior citizen</SelectItem><SelectItem value="child">Child</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="emergency-name">Emergency contact name</Label><Input id="emergency-name" value={profile.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} disabled={loading} /></div>
            <div className="space-y-1.5"><Label htmlFor="emergency-number">Emergency contact number</Label><Input id="emergency-number" type="tel" value={profile.emergencyNumber} onChange={(e) => update("emergencyNumber", e.target.value)} disabled={loading} /></div>
          </div>
        </section>

        <section className="border-t border-border pt-7">
          <div className="mb-4 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary"><Bell size={18} /></span><h2 className="font-display text-xl font-semibold">Notifications</h2></div>
          <div className="divide-y divide-border rounded-lg border border-border bg-card px-4">
            <label className="flex items-center justify-between gap-4 py-4"><span><span className="block text-sm font-medium">Service delays</span><span className="block text-xs text-muted-foreground">Important updates for your journeys.</span></span><Switch checked={profile.notifyDelays} onCheckedChange={(checked) => update("notifyDelays", checked)} /></label>
            <label className="flex items-center justify-between gap-4 py-4"><span><span className="block text-sm font-medium">Offers and updates</span><span className="block text-xs text-muted-foreground">Occasional news from Sarthi AI.</span></span><Switch checked={profile.notifyOffers} onCheckedChange={(checked) => update("notifyOffers", checked)} /></label>
          </div>
        </section>

        <Button type="submit" size="lg" disabled={loading || saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </form>

      <section className="border-t border-destructive/25 pt-7">
        <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"><ShieldAlert size={18} /></span><div><h2 className="font-display text-xl font-semibold">Delete account</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">Permanently delete your profile, saved journeys, chat history, complaints, and recordings. This cannot be undone.</p></div></div>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button type="button" variant="destructive" className="mt-4">Delete account</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete your Sarthi AI account?</AlertDialogTitle><AlertDialogDescription>This permanently removes your account and all associated data. You will not be able to recover it.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Keep account</AlertDialogCancel><AlertDialogAction onClick={removeAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleting ? "Deleting…" : "Yes, delete permanently"}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}