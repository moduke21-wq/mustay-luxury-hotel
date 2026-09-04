import { createFileRoute } from "@tanstack/react-router";

const TOKEN = "mustay-one-time-owner-setup-7f31";
const OWNER_EMAIL = "dukuly1300@gmail.com";

export const Route = createFileRoute("/api/public/setup-owner")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { token?: string; password?: string };
        if (body.token !== TOKEN || !body.password || body.password.length < 8) {
          return new Response("forbidden", { status: 403 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", OWNER_EMAIL)
          .maybeSingle();
        if (!profile) return new Response("owner not found", { status: 404 });
        const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
          password: body.password,
          email_confirm: true,
        });
        if (error) return new Response(error.message, { status: 500 });
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: profile.id, role: "admin" }, { onConflict: "user_id,role" });
        return Response.json({ ok: true });
      },
    },
  },
});
