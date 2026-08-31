import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminRoom = {
  id: string;
  room_number: string;
  category: string;
  price_per_night: number;
  capacity: number;
  bed_type: string;
  amenities: string[];
  images: string[];
  imageUrls: string[];
  status: string;
  floor: number;
};

export type AdminBooking = {
  id: string;
  booking_number: string;
  verification_code: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  room_id: string | null;
  room_number: string | null;
  room_category: string;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string;
  check_out_time: string;
  num_guests: number;
  total_amount: number;
  payment_status: string;
  status: string;
  special_requests: string | null;
  created_at: string;
};

async function signed(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("room-gallery")
    .createSignedUrls(paths, 60 * 60 * 24 * 7);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: roomRows }, { data: bookingRows }] = await Promise.all([
      supabase.from("rooms").select("*").order("room_number"),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    const rooms = roomRows ?? [];
    const allPaths = rooms.flatMap((r) => r.images ?? []);
    const urls = await signed(allPaths);
    const urlByPath = new Map(allPaths.map((p, i) => [p, urls[i] ?? ""]));

    const roomNumberById = new Map(rooms.map((r) => [r.id, r.room_number]));

    return {
      rooms: rooms.map((r) => ({
        ...r,
        price_per_night: Number(r.price_per_night),
        amenities: r.amenities ?? [],
        images: r.images ?? [],
        imageUrls: (r.images ?? []).map((p) => urlByPath.get(p) ?? "").filter(Boolean),
      })) as AdminRoom[],
      bookings: (bookingRows ?? []).map((b) => ({
        ...b,
        total_amount: Number(b.total_amount),
        room_number: b.room_id ? (roomNumberById.get(b.room_id) ?? null) : null,
      })) as AdminBooking[],
    };
  });

export const confirmBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ bookingId: z.string().uuid(), roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: code, error } = await context.supabase.rpc("confirm_booking", {
      p_booking_id: data.bookingId,
      p_room_id: data.roomId,
    });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const, code: code as string };
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bookingId: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"]),
        markPaid: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: { status: string; payment_status?: string } = { status: data.status };
    if (data.markPaid) patch.payment_status = "paid";


    const { data: booking, error } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", data.bookingId)
      .select("room_id")
      .maybeSingle();

    if (error) return { ok: false as const, message: error.message };

    if (booking?.room_id) {
      const roomStatus =
        data.status === "checked_in"
          ? "occupied"
          : data.status === "checked_out"
            ? "cleaning"
            : data.status === "cancelled" || data.status === "no_show"
              ? "available"
              : null;
      if (roomStatus) {
        await supabase.from("rooms").update({ status: roomStatus }).eq("id", booking.room_id);
      }
    }
    return { ok: true as const };
  });

export const setRoomStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        roomId: z.string().uuid(),
        status: z.enum(["available", "reserved", "occupied", "cleaning", "maintenance"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("rooms")
      .update({ status: data.status })
      .eq("id", data.roomId);
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });

export const addRoomImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid(), path: z.string().min(3).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: room } = await supabase.from("rooms").select("images").eq("id", data.roomId).maybeSingle();
    const images = [...(room?.images ?? []), data.path];
    const { error } = await supabase.from("rooms").update({ images }).eq("id", data.roomId);
    return error ? { ok: false as const, message: error.message } : { ok: true as const };
  });

export const removeRoomImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid(), path: z.string().min(3).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: room } = await supabase.from("rooms").select("images").eq("id", data.roomId).maybeSingle();
    const images = (room?.images ?? []).filter((p) => p !== data.path);
    const { error } = await supabase.from("rooms").update({ images }).eq("id", data.roomId);
    if (error) return { ok: false as const, message: error.message };
    await supabase.storage.from("room-gallery").remove([data.path]);
    return { ok: true as const };
  });
