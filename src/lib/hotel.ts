export const HOTEL_NAME = "Mustay Luxury";
export const HOTEL_TAGLINE = "Your Home Away From Home in Sierra Leone";
export const HOTEL_WHATSAPP = "23278000000";
export const OPERATIONAL_ROOMS = 12;
export const CONSTRUCTION_ROOMS = 32;

export const CATEGORY_PRICES: Record<string, number> = {
  "Deluxe Suite": 800,
  "Standard Room": 700,
};

export function formatNLe(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `NLe ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0)}`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const ROOM_STATUS_LABEL: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
};

export function whatsappLink(phone: string, message: string): string {
  const digits = (phone || HOTEL_WHATSAPP).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message.slice(0, 900))}`;
}
