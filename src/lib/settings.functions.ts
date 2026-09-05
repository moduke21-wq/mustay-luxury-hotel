import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-auth";
import type { Database } from "@/integrations/supabase/types";

export const SETTING_KEYS = [
  "whatsapp_number",
  "phone_primary",
  "phone_secondary",
  "address",
  "hero_title",
  "hero_subtitle",
  "about_text",
  "expansion_text",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
export type SiteSettings = Record<string, string>;

export const SETTING_LABELS: Record<SettingKey, string> = {
  whatsapp_number: "WhatsApp number (digits only, e.g. 23276933022)",
  phone_primary: "Primary phone",
  phone_secondary: "Second phone",
  address: "Hotel address",
  hero_title: "Homepage headline",
  hero_subtitle: "Homepage sub-headline",
  about_text: "Welcome / about text",
  expansion_text: "Expansion (construction) text",
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("site_settings").select("key, value");
  const settings: SiteSettings = {};
  for (const row of data ?? []) settings[row.key] = row.value;
  return settings;
});

export const getSiteMedia = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (publicClient().from("site_media" as never) as any)
    .select("id,slot,room_id,path,label,alt_text,display_order")
    .order("display_order", { ascending: true });
  if (error) return [];
  return data ?? [];
});

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ settings: z.record(z.string(), z.string().max(2000)) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const rows = Object.entries(data.settings)
      .filter(([key]) => (SETTING_KEYS as readonly string[]).includes(key))
      .map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
    if (rows.length === 0) return { ok: true as const };
    const { error } = await context.supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });

export const setCategoryPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ category: z.string().min(2).max(60), price: z.coerce.number().min(0).max(1000000) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("rooms")
      .update({ price_per_night: data.price })
      .eq("category", data.category);
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });
