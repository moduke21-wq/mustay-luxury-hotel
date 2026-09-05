import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getSiteMedia } from "@/lib/settings.functions";

const ADMIN_BACKGROUND_SLOT = "admin-background";

const MEDIA_SLOTS = [
  {
    slot: "hero",
    label: "Hero background",
    help: "Main homepage background behind the welcome headline.",
  },
  {
    slot: "standard-room",
    label: "Standard room",
    help: "Room headline and background image for the Standard Room section.",
  },
  {
    slot: "deluxe-room",
    label: "Deluxe room",
    help: "Room headline and background image for the Deluxe Room section.",
  },
  {
    slot: "construction",
    label: "Construction / new building",
    help: "The room expansion section and its background image.",
  },
  {
    slot: "gallery",
    label: "Gallery image",
    help: "A public gallery image. Upload several and order them below.",
  },
  {
    slot: "footer",
    label: "Footer / contact background",
    help: "Background image for the public contact and footer area.",
  },
  {
    slot: ADMIN_BACKGROUND_SLOT,
    label: "Admin dashboard background",
    help: "A private visual backdrop for the Mustay operations dashboard.",
  },
  {
    slot: "admin-profile",
    label: "CEO Mustapha profile photo",
    help: "The profile photo shown in the admin dashboard header.",
  },
] as const;

type MediaRow = {
  id: string;
  slot: string;
  path: string;
  label: string;
  alt_text: string;
  display_order: number;
};

function MediaSlotRoomSettings({
  room,
  saving,
  onSave,
}: {
  room: any;
  saving: boolean;
  onSave: (room: any) => void;
}) {
  const [price, setPrice] = useState(String(room.price_per_night ?? ""));
  const [offers, setOffers] = useState((room.amenities ?? []).join(", "));

  return (
    <div className="mt-3 rounded-md border border-gold/30 bg-gold/5 p-3">
      <p className="text-sm font-semibold">Room price and offers</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
        <div>
          <Label htmlFor={`price-${room.id}`}>Price per night (NLe)</Label>
          <Input
            id={`price-${room.id}`}
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`offers-${room.id}`}>What it offers</Label>
          <Input
            id={`offers-${room.id}`}
            value={offers}
            onChange={(event) => setOffers(event.target.value)}
            placeholder="Wi-Fi, breakfast, air conditioning"
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-navy text-background hover:bg-navy/90"
          disabled={saving}
          onClick={() =>
            onSave({
              ...room,
              price_per_night: Number(price),
              amenities: offers
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        >
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

export function SiteMediaManager() {
  const queryClient = useQueryClient();
  const {
    data: media = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["site-media"],
    queryFn: async () => (await getSiteMedia()) as MediaRow[],
  });
  const [busy, setBusy] = useState<string | null>(null);
  async function upload(slot: string, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Images must be smaller than 8 MB.");
      return;
    }
    setBusy(slot);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${slot}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("site-media")
      .upload(path, file, { upsert: false });
    if (uploadError) {
      toast.error(uploadError.message);
      setBusy(null);
      return;
    }
    const { data: publicData } = supabase.storage.from("site-media").getPublicUrl(path);
    const existing = slot === "gallery" ? undefined : media.find((item) => item.slot === slot);
    const payload = {
      slot,
      path: publicData.publicUrl,
      label: MEDIA_SLOTS.find((item) => item.slot === slot)?.label ?? slot,
      alt_text: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      display_order: existing?.display_order ?? media.filter((item) => item.slot === slot).length,
    };
    const { error: saveError } = existing
      ? await (supabase.from("site_media" as never) as any).update(payload).eq("id", existing.id)
      : await (supabase.from("site_media" as never) as any).insert(payload);
    setBusy(null);
    if (saveError) {
      toast.error(saveError.message);
      return;
    }
    toast.success("Website image updated");
    queryClient.invalidateQueries({ queryKey: ["site-media"] });
  }

  async function remove(item: MediaRow) {
    setBusy(item.id);
    const { error } = await (supabase.from("site_media" as never) as any)
      .delete()
      .eq("id", item.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Website image removed");
      queryClient.invalidateQueries({ queryKey: ["site-media"] });
    }
  }

  return (
    <section id="admin-profile-media" className="mt-6 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <ImagePlus className="mt-1 h-5 w-5 text-gold" />
        <div>
          <h2 className="font-display text-xl font-semibold">Website pictures</h2>
          <p className="text-sm text-muted-foreground">
            Upload the exact images for each old website headline and background slot. Images go
            live immediately.
          </p>
        </div>
      </div>
      {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading media…</p> : null}
      {isError ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load media.{" "}
          {error instanceof Error ? error.message : "Please refresh and try again."}
        </div>
      ) : null}
      {media.filter((item) => item.slot === "gallery").length > 0 ? (
        <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-3">
          <p className="text-sm font-medium">Uploaded gallery images</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {media
              .filter((item) => item.slot === "gallery")
              .map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-md border border-border"
                >
                  <img
                    src={item.path}
                    alt={item.alt_text || "Gallery image"}
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => void remove(item)}
                    disabled={busy === item.id}
                    aria-label={`Remove ${item.alt_text || "gallery image"}`}
                  >
                    <Trash2 data-icon="inline-start" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {MEDIA_SLOTS.map((definition) => {
          const item = media.find((entry) => entry.slot === definition.slot);
          const inputId = `media-${definition.slot}`;
          return (
            <div
              key={definition.slot}
              className="overflow-hidden rounded-lg border border-border bg-secondary/30"
            >
              <div className="aspect-[16/9] bg-muted">
                {item ? (
                  <img
                    src={item.path}
                    alt={item.alt_text || definition.label}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image uploaded
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 p-3">
                <div>
                  <p className="font-medium">{definition.label}</p>
                  <p className="text-xs text-muted-foreground">{definition.help}</p>
                </div>
                <Label
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
                >
                  {busy === definition.slot ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}{" "}
                  Upload image
                </Label>
                <Input
                  id={inputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(definition.slot, file);
                    event.currentTarget.value = "";
                  }}
                />
                {item ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void remove(item)}
                    disabled={busy === item.id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove image
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
