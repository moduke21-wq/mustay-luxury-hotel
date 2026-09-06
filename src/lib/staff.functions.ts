import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-auth";

export const OWNER_EMAIL = "mustaybookkeepingservices@gmail.com";

export type StaffMember = {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  createdAt: string;
  isOwner: boolean;
  bannedUntil: string | null;
  lastSignInAt: string | null;
};

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: roles }, { data: authUsers }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, full_name, created_at").order("created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role as string]);
    }

    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      roles: roleMap.get(p.id) ?? [],
      createdAt: p.created_at,
      isOwner: p.email.toLowerCase() === OWNER_EMAIL,
      bannedUntil: authUsers?.users.find((u) => u.id === p.id)?.banned_until ?? null,
      lastSignInAt: authUsers?.users.find((u) => u.id === p.id)?.last_sign_in_at ?? null,
    })) as StaffMember[];
  });

export const inviteOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const redirectTo =
      process.env["NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL"] ??
      `${process.env["SUPABASE_URL"]}/auth/v1/callback`;
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingOwner = existing.users.find((user) => user.email?.toLowerCase() === OWNER_EMAIL);
    let owner = existingOwner;

    if (!owner) {
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(OWNER_EMAIL, {
        redirectTo,
        data: { full_name: "Mustay Luxury Owner", is_owner: true },
      });
      if (error || !invited.user) {
        return {
          ok: false as const,
          message: error?.message ?? "Could not send the owner setup invitation.",
        };
      }
      owner = invited.user;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      { id: owner.id, email: OWNER_EMAIL, full_name: "Mustay Luxury Owner" },
      { onConflict: "id" },
    );
    if (profileError) return { ok: false as const, message: `Owner profile could not be saved: ${profileError.message}` };

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: owner.id, role: "admin" }, { onConflict: "user_id,role" });
    if (roleError) return { ok: false as const, message: `Owner permissions could not be saved: ${roleError.message}` };

    return { ok: true as const, invited: !existingOwner };
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        fullName: z.string().trim().max(120).optional().or(z.literal("")),
        role: z.enum(["admin", "manager", "receptionist"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      await assertAdmin(supabaseAdmin, context.userId);
    } catch {
      return {
        ok: false as const,
        message: "Administrator access is required to create staff accounts.",
      };
    }
    const email = data.email.toLowerCase();

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName || email },
    });
    if (error || !created.user) {
      const duplicate = error?.status === 422 || error?.message.toLowerCase().includes("already");
      return {
        ok: false as const,
        message: duplicate ? "An account with that email already exists." : (error?.message ?? "Could not create account."),
      };
    }

    const userId = created.user.id;
    const profileResult = await supabaseAdmin.from("profiles").upsert(
      { id: userId, email, full_name: data.fullName || email },
      { onConflict: "id" },
    );
    if (profileResult.error) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, message: `Staff profile could not be saved: ${profileResult.error.message}` };
    }

    const roleResult = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });
    if (roleResult.error) {
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, message: `Staff permissions could not be saved: ${roleResult.error.message}` };
    }

    return { ok: true as const };
  });

export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ userId: z.string().uuid(), role: z.enum(["admin", "manager", "receptionist"]) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });

export const setStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });

export const setStaffBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId)
      return { ok: false as const, message: "You cannot ban your own account." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();
    if (profile?.email?.toLowerCase() === OWNER_EMAIL)
      return { ok: false as const, message: "The owner account cannot be banned." };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.banned ? "876000h" : "none",
    });
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });

export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId)
      return { ok: false as const, message: "You cannot remove your own account." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();
    if (profile?.email?.toLowerCase() === OWNER_EMAIL) {
      return { ok: false as const, message: "The owner account cannot be removed." };
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });
