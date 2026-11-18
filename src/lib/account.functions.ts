import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: files, error: listError } = await supabaseAdmin.storage
      .from("complaint-audio")
      .list(context.userId, { limit: 1000 });
    if (listError) throw new Error("Your stored recordings could not be removed.");

    const filePaths = (files ?? [])
      .filter((file) => file.name)
      .map((file) => `${context.userId}/${file.name}`);
    if (filePaths.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage
        .from("complaint-audio")
        .remove(filePaths);
      if (removeError) throw new Error("Your stored recordings could not be removed.");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Your account could not be deleted. Please try again.");
    return { deleted: true };
  });