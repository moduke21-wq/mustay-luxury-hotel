import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RoomPlaceholder } from "@/components/RoomPlaceholder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  addRoomImage,
  getAdminOverview,
  removeRoomImage,
  setRoomStatus,
  type AdminRoom,
} from "@/lib/admin.functions";
import { ROOM_STATUS_LABEL, formatNLe } from "@/lib/hotel";

export const Route = createFileRoute("/admin/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Room & Housekeeping Manager — Mustay Luxury" },
      { name: "description", content: "Manage room status, housekeeping and room photography for Mustay Luxury." },
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

function RoomsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });
  const [editing, setEditing] = useState<AdminRoom | null>(null);

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
  const current = editing ? (rooms.find((r) => r.id === editing.id) ?? editing) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-3xl font-semibold">Rooms & housekeeping</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tap a status chip to change it, or open a room to manage photos.</p>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading rooms…</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <article key={room.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl font-semibold">Room {room.room_number}</p>
                <p className="text-xs text-muted-foreground">
                  {room.category} · Floor {room.floor} · {formatNLe(room.price_per_night)}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${STATUS_STYLE[room.status]}`}>
                {ROOM_STATUS_LABEL[room.status] ?? room.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusMut.isPending || room.status === s}
                  onClick={() => statusMut.mutate({ roomId: room.id, status: s })}
                  className={`rounded-full border px-2.5 py-1 text-[0.65rem] transition-colors disabled:opacity-40 ${
                    room.status === s ? "border-gold bg-gold/10 text-gold" : "border-border hover:bg-secondary"
                  }`}
                >
                  {ROOM_STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setEditing(room)}>
              <ImagePlus className="mr-2 h-4 w-4" /> Photos ({room.imageUrls.length})
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={!!current} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Room {current?.room_number} photos
            </DialogTitle>
          </DialogHeader>
          {current && <PhotoManager room={current} onChanged={invalidate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoManager({ room, onChanged }: { room: AdminRoom; onChanged: () => void }) {
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {room.images.length === 0 && (
          <RoomPlaceholder label={room.category} className="col-span-2 h-32 rounded-lg sm:col-span-3" />
        )}
        {room.images.map((path, i) => (
          <div key={path} className="group relative overflow-hidden rounded-lg border border-border">
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
