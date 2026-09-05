import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminOverview } from "@/lib/admin.functions";
import {
  SETTING_KEYS,
  SETTING_LABELS,
  getSiteSettings,
  saveSiteSettings,
  setCategoryPrice,
  type SettingKey,
} from "@/lib/settings.functions";
import { formatNLe } from "@/lib/hotel";
import { PaymentPreview } from "@/components/admin/payment-preview";
import { SiteContentMap } from "@/components/admin/site-content-map";
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
  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: () => saveSiteSettings({ data: { settings: form } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Website updated");
        queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      } else toast.error(res.message ?? "Could not save");
    },
  });

  const categories = Array.from(
    new Map((overview?.rooms ?? []).map((r) => [r.category, r.price_per_night])).entries(),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-3xl font-semibold">Admin settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Private controls for CEO Mustapha, website content, rooms, media, and contact details.
      </p>

      <section className="mt-6 rounded-xl border border-gold/30 bg-gold/10 p-4">
        <h2 className="font-display text-xl font-semibold">CEO Mustapha profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This private administrator profile is separate from public website content. Manage your
          name and profile photo here; staff cannot see or edit it.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              document.getElementById("admin-profile-media")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Manage profile photo
          </Button>
        </div>
      </section>

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

      <SiteContentMap />

      <SiteMediaManager />

      <PaymentPreview />

      <section className="mt-6 rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-xl font-semibold">Room pricing</h2>
        <p className="text-xs text-muted-foreground">
          Sets the nightly rate for every room in the category.
        </p>
        <div className="mt-4 space-y-3">
          {categories.map(([category, price]) => (
            <PriceRow key={category} category={category} price={price} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PriceRow({ category, price }: { category: string; price: number }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(price));
  useEffect(() => setValue(String(price)), [price]);

  const mut = useMutation({
    mutationFn: () => setCategoryPrice({ data: { category, price: Number(value) } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`${category} is now ${formatNLe(Number(value))} per night`);
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      } else toast.error(res.message ?? "Could not update price");
    },
  });

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label htmlFor={`price-${category}`}>{category} (NLe per night)</Label>
        <Input
          id={`price-${category}`}
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button onClick={() => mut.mutate()} disabled={mut.isPending} variant="outline">
        Update
      </Button>
    </div>
  );
}
