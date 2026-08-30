import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function signImages(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("room-gallery")
    .createSignedUrls(paths, 60 * 60 * 24 * 7);
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}

export type PublicCategory = {
  category: string;
  price: number;
  capacity: number;
  bedType: string;
  amenities: string[];
  images: string[];
  totalRooms: number;
  availableRooms: number;
};

export const getPublicRooms = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("room_number, category, price_per_night, capacity, bed_type, amenities, images, status")
    .order("room_number");

  if (error) return { categories: [] as PublicCategory[], availableNow: 0 };

  const rooms = data ?? [];
  const byCategory = new Map<string, PublicCategory>();
  const imagePaths = new Map<string, string[]>();

  for (const room of rooms) {
    const existing = byCategory.get(room.category);
    if (!existing) {
      byCategory.set(room.category, {
        category: room.category,
        price: Number(room.price_per_night),
        capacity: room.capacity,
        bedType: room.bed_type,
        amenities: room.amenities ?? [],
        images: [],
        totalRooms: 1,
        availableRooms: room.status === "available" ? 1 : 0,
      });
    } else {
      existing.totalRooms += 1;
      if (room.status === "available") existing.availableRooms += 1;
      existing.capacity = Math.max(existing.capacity, room.capacity);
    }
    const paths = imagePaths.get(room.category) ?? [];
    for (const img of room.images ?? []) {
      if (paths.length < 4) paths.push(img);
    }
    imagePaths.set(room.category, paths);
  }

  const categories = Array.from(byCategory.values()).sort((a, b) => b.price - a.price);
  for (const category of categories) {
    category.images = await signImages(imagePaths.get(category.category) ?? []);
  }

  return {
    categories,
    availableNow: rooms.filter((r) => r.status === "available").length,
  };
});

const bookingSchema = z.object({
  guestName: z.string().trim().min(2).max(120),
  guestPhone: z.string().trim().min(6).max(30),
  guestEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  roomCategory: z.enum(["Deluxe Suite", "Standard Room"]),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numGuests: z.coerce.number().int().min(1).max(6),
  specialRequests: z.string().trim().max(600).optional().or(z.literal("")),
});

export const createGuestBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: result, error } = await supabase.rpc("create_guest_booking", {
      p_guest_name: data.guestName,
      p_guest_phone: data.guestPhone,
      p_guest_email: data.guestEmail || null,
      p_room_category: data.roomCategory,
      p_check_in_date: data.checkInDate,
      p_check_in_time: `${data.checkInTime}:00`,
      p_check_out_date: data.checkOutDate,
      p_num_guests: data.numGuests,
      p_special_requests: data.specialRequests || null,
    });

    if (error) {
      console.error("create_guest_booking failed", error.message);
      return { ok: false as const, message: "We could not save your request. Please check your dates and try again." };
    }

    const row = Array.isArray(result) ? result[0] : result;
    return {
      ok: true as const,
      bookingNumber: row?.booking_number as string,
      totalAmount: Number(row?.total_amount ?? 0),
    };
  });

export const lookupBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ reference: z.string().trim().min(6).max(40) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: result, error } = await supabase.rpc("lookup_booking", {
      p_reference: data.reference,
    });
    if (error) {
      console.error("lookup_booking failed", error.message);
      return { booking: null };
    }
    const row = Array.isArray(result) ? result[0] : result;
    return { booking: row ?? null };
  });
