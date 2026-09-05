import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import standardImg from "@/assets/mustay/standard-room.asset.json";
import deluxeImg from "@/assets/mustay/deluxe-room.asset.json";
import { RoomPlaceholder } from "@/components/RoomPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  addRoomImage,
  createRoom,
  deleteRoom,
  getAdminOverview,
  removeRoomImage,
  setRoomStatus,
  updateRoom,
  type AdminRoom,
} from "@/lib/admin.functions";
import { ROOM_STATUS_LABEL, formatNLe } from "@/lib/hotel";

export const Route = createFileRoute("/admin/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Room & Housekeeping Manager — Mustay Luxury" },
      {
        name: "description",
        content:
          "Add rooms, set prices and descriptions, manage status and photos for Mustay Luxury.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Room Manager — Mustay Luxury" },
      { property: "og:description", content: "Internal room and housekeeping management." },
    ],
  }),
  component: RoomsPage,
});

const STATUSES = ["available", "reserved", "occupied", "cleaning", "maintenance"] as const;

const STATUS_STYLE: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-700",
  reserved: "bg-gold/20 text-gold",
  occupied: "bg-red-500/15 text-red-700",
  cleaning: "bg-sky-500/15 text-sky-700",
  maintenance: "bg-muted text-muted-foreground",
};

const SITE_IMAGE: Record<string, string> = {
  "Standard Room": standardImg.url,
  "Deluxe Suite": deluxeImg.url,
};

type RoomForm = {
  room_number: string;
  category: string;
  price_per_night: string;
  capacity: string;
  bed_type: string;
  floor: string;
  description: string;
  amenities: string;
};

const EMPTY_FORM: RoomForm = {
  room_number: "",
  category: "Standard Room",
  price_per_night: "700",
  capacity: "2",
  bed_type: "Double Bed",
  floor: "1",
  description: "",
  amenities: "24/7 power & water, Free Wi-Fi, Smart TV, Air conditioning, Private bathroom",
};

function RoomsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });
  const [photoRoom, setPhotoRoom] = useState<AdminRoom | null>(null);
  const [editRoom, setEditRoom] = useState<AdminRoom | "new" | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] });

  const statusMut = useMutation({
    mutationFn: (vars: { roomId: string; status: (typeof STATUSES)[number] }) =>
      setRoomStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Room updated");
      invalidate();
    },
  });

  const rooms = data?.rooms ?? [];
  const gallery = data?.gallery ?? [];
  const current = photoRoom ? (rooms.find((r) => r.id === photoRoom.id) ?? photoRoom) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Rooms & housekeeping</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add rooms, set the nightly price and text guests read, and manage photos.
          </p>
        </div>
        <Button
          className="bg-navy text-background hover:bg-navy/90"
          onClick={() => setEditRoom("new")}
        >
          <Plus className="mr-2 h-4 w-4" /> Add room
        </Button>
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading rooms…</p>}
      {isError && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load rooms.{" "}
          {error instanceof Error ? error.message : "Please refresh and try again."}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const preview = room.imageUrls[0] ?? SITE_IMAGE[room.category];
          return (
            <article
              key={room.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative h-32 w-full bg-secondary">
                {preview ? (
                  <img
                    src={preview}
                    alt={`Room ${room.room_number}`}
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <RoomPlaceholder label={room.category} className="h-32 w-full" />
                )}
                <span
                  className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${STATUS_STYLE[room.status]}`}
                >
                  {ROOM_STATUS_LABEL[room.status] ?? room.status}
                </span>
                {room.imageUrls.length === 0 && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2 py-1 text-[0.6rem] text-muted-foreground">
                    Website default photo
                  </span>
                )}
              </div>

              <div className="p-4">
                <p className="font-display text-2xl font-semibold">Room {room.room_number}</p>
                <p className="text-xs text-muted-foreground">
                  {room.category} · Floor {room.floor} · {formatNLe(room.price_per_night)}
                </p>
                {room.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {room.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={statusMut.isPending || room.status === s}
                      onClick={() => statusMut.mutate({ roomId: room.id, status: s })}
                      className={`rounded-full border px-2.5 py-1 text-[0.65rem] transition-colors disabled:opacity-40 ${
                        room.status === s
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {ROOM_STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPhotoRoom(room)}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" /> Photos ({room.imageUrls.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditRoom(room)}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={!!current} onOpenChange={(open) => !open && setPhotoRoom(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Room {current?.room_number} photos
            </DialogTitle>
          </DialogHeader>
          {current && <PhotoManager room={current} gallery={gallery} onChanged={invalidate} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRoom} onOpenChange={(open) => !open && setEditRoom(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editRoom === "new" ? "Add a room" : `Edit room ${editRoom?.room_number ?? ""}`}
            </DialogTitle>
          </DialogHeader>
          {editRoom && (
            <RoomEditor
              room={editRoom === "new" ? null : editRoom}
              onDone={() => {
                setEditRoom(null);
                invalidate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomEditor({ room, onDone }: { room: AdminRoom | null; onDone: () => void }) {
  const [form, setForm] = useState<RoomForm>(EMPTY_FORM);

  useEffect(() => {
    if (!room) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      room_number: room.room_number,
      category: room.category,
      price_per_night: String(room.price_per_night),
      capacity: String(room.capacity),
      bed_type: room.bed_type,
      floor: String(room.floor),
      description: room.description ?? "",
      amenities: (room.amenities ?? []).join(", "),
    });
  }, [room]);

  const payload = () => ({
    room_number: form.room_number.trim(),
    category: form.category.trim(),
    price_per_night: Number(form.price_per_night || 0),
    capacity: Number(form.capacity || 1),
    bed_type: form.bed_type.trim(),
    floor: Number(form.floor || 0),
    description: form.description.trim(),
    amenities: form.amenities
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      room ? updateRoom({ data: { id: room.id, ...payload() } }) : createRoom({ data: payload() }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(room ? "Room saved" : "Room added");
      onDone();
    },
    onError: () => toast.error("Please check the details and try again."),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteRoom({ data: { roomId: room!.id } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Room removed");
      onDone();
    },
  });

  const field = (key: keyof RoomForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="room_number">Room number</Label>
          <Input id="room_number" {...field("room_number")} />
        </div>
        <div>
          <Label htmlFor="category">Room type</Label>
          <Input id="category" {...field("category")} />
        </div>
        <div>
          <Label htmlFor="price">Price per night (NLe)</Label>
          <Input id="price" inputMode="numeric" {...field("price_per_night")} />
        </div>
        <div>
          <Label htmlFor="capacity">Sleeps</Label>
          <Input id="capacity" inputMode="numeric" {...field("capacity")} />
        </div>
        <div>
          <Label htmlFor="bed">Bed type</Label>
          <Input id="bed" {...field("bed_type")} />
        </div>
        <div>
          <Label htmlFor="floor">Floor</Label>
          <Input id="floor" inputMode="numeric" {...field("floor")} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description shown to guests</Label>
        <Textarea id="description" rows={3} {...field("description")} />
      </div>
      <div>
        <Label htmlFor="amenities">Features (separate with commas)</Label>
        <Textarea id="amenities" rows={2} {...field("amenities")} />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          className="bg-navy text-background hover:bg-navy/90"
          disabled={saveMut.isPending || !form.room_number.trim()}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {room ? "Save changes" : "Add room"}
        </Button>
        {room && (
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            disabled={deleteMut.isPending}
            onClick={() => deleteMut.mutate()}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete room
          </Button>
        )}
      </div>
    </div>
  );
}

type GalleryImage = { id: string; path: string; label: string | null; alt_text: string | null };

function PhotoManager({
  room,
  gallery,
  onChanged,
}: {
  room: AdminRoom;
  gallery: GalleryImage[];
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const addMut = useMutation({
    mutationFn: (path: string) => addRoomImage({ data: { roomId: room.id, path } }),
    onSuccess: onChanged,
  });
  const removeMut = useMutation({
    mutationFn: (path: string) => removeRoomImage({ data: { roomId: room.id, path } }),
    onSuccess: () => {
      toast.success("Photo deleted");
      onChanged();
    },
  });

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 8MB`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${room.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("room-gallery").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast.error(error.message);
        continue;
      }
      await addMut.mutateAsync(path);
      toast.success(`${file.name} uploaded`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const siteImage = SITE_IMAGE[room.category];
  const addGalleryMut = useMutation({
    mutationFn: (path: string) => addRoomImage({ data: { roomId: room.id, path } }),
    onSuccess: () => {
      toast.success("Gallery photo assigned to room");
      onChanged();
    },
    onError: () => toast.error("Could not assign that gallery photo."),
  });

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        ) : (
          <ImagePlus className="h-6 w-6 text-gold" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">Drag & drop photos here, or</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void upload(e.target.files)}
        />
      </div>

      {gallery.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-3">
          <p className="text-sm font-medium">Choose from website gallery</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign an existing website image to this room without uploading it again.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.map((image) => {
              const assigned = room.images.includes(image.path);
              return (
                <button
                  key={image.id}
                  type="button"
                  disabled={assigned || addGalleryMut.isPending}
                  onClick={() => addGalleryMut.mutate(image.path)}
                  className="overflow-hidden rounded-md border border-border text-left disabled:opacity-50"
                >
                  <img
                    src={image.path}
                    alt={image.alt_text || image.label || "Gallery image"}
                    className="h-24 w-full object-cover"
                  />
                  <span className="block truncate px-2 py-1 text-xs">
                    {assigned ? "Assigned" : image.label || "Gallery image"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {room.images.length === 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">
            No photo uploaded yet — this is the picture guests currently see on the website.
          </p>
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            {siteImage ? (
              <img
                src={siteImage}
                alt={`${room.category} on the website`}
                className="h-40 w-full object-cover"
              />
            ) : (
              <RoomPlaceholder label={room.category} className="h-40 w-full" />
            )}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {room.images.map((path, i) => (
          <div
            key={path}
            className="group relative overflow-hidden rounded-lg border border-border"
          >
            <img
              src={room.imageUrls[i]}
              alt={`Room ${room.room_number} photo ${i + 1}`}
              loading="lazy"
              className="h-28 w-full object-cover"
            />
            <button
              type="button"
              aria-label="Delete photo"
              disabled={removeMut.isPending}
              onClick={() => removeMut.mutate(path)}
              className="absolute right-1.5 top-1.5 rounded-md bg-red-600 p-1.5 text-white shadow hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
