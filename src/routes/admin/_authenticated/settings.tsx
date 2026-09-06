import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SETTING_KEYS,
  SETTING_LABELS,
  getSiteSettings,
  saveSiteDraft,
  type SettingKey,
} from "@/lib/settings.functions";
import { SiteMediaManager } from "@/components/admin/site-media-manager";
export const Route = createFileRoute("/admin/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Website Settings — Mustay Luxury" },
      {
        name: "description",
        content: "Edit Mustay Luxury website text, contact numbers and room pricing.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Website Settings — Mustay Luxury" },
      { property: "og:description", content: "Internal website content management." },
    ],
  }),
  component: SettingsPage,
});
const LONG_FIELDS: SettingKey[] = ["address", "about_text", "expansion_text"];
function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
  });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);
  const saveMut = useMutation({
    mutationFn: () => saveSiteDraft({ data: { content: { settings: form } } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Website content saved and is live");
        queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      } else toast.error(res.message ?? "Could not save draft");
    },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-3xl font-semibold">Admin settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edit supported live website text and images. Changes save to the same database used by the public website.
      </p>
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="rounded-md border border-gold/30 bg-gold/10 p-3 text-sm text-muted-foreground">
          Contact settings, including the WhatsApp number, are administrator-only. Staff can view
          operations but cannot change public contact details.
        </div>
        {SETTING_KEYS.map((key) => (
          <div key={key}>
            <Label htmlFor={key}>{SETTING_LABELS[key]}</Label>
            {LONG_FIELDS.includes(key) ? (
              <Textarea
                id={key}
                rows={3}
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ) : (
              <Input
                id={key}
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {saveMut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save website content
        </Button>
      </section>
      <SiteMediaManager />
    </div>
  );
}
