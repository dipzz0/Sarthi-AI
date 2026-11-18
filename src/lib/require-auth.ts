import { redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side gate for the app screens: no account, no app.
 * Used with `ssr: false` because the session lives in browser storage.
 */
export async function requireAccount() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth" });
  return { user: data.user };
}
