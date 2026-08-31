import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Clock, MessageCircle, Search, XCircle } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupBooking } from "@/lib/public.functions";
import {
  BOOKING_STATUS_LABEL,
  HOTEL_WHATSAPP,
  formatDate,
  formatNLe,
  formatTime,
  whatsappLink,
} from "@/lib/hotel";

const searchSchema = z.object({ ref: z.string().optional() });

export const Route = createFileRoute("/booking-status")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Check Your Booking — Mustay Luxury" },
      {
        name: "description",
        content:
          "Track your Mustay Luxury reservation with your booking number or 6-digit verification code.",
      },
      { property: "og:title", content: "Check Your Booking — Mustay Luxury" },
      {
        property: "og:description",
        content: "Enter your booking number or verification code to view your confirmation voucher.",
      },
    ],
  }),
  component: BookingStatusPage,
});

type Booking = NonNullable<Awaited<ReturnType<typeof lookupBooking>>["booking"]>;

function BookingStatusPage() {
  const { ref } = Route.useSearch();
  const navigate = useNavigate({ from: "/booking-status" });
  const [reference, setReference] = useState(ref ?? "");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [searched, setSearched] = useState(false);

  const mutation = useMutation({
    mutationFn: (value: string) => lookupBooking({ data: { reference: value } }),
    onSuccess: (res) => {
      setBooking((res.booking as Booking) ?? null);
      setSearched(true);
    },
  });

  useEffect(() => {
    if (ref && ref.trim().length >= 6) mutation.mutate(ref.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = reference.trim();
    if (value.length < 6) return;
    navigate({ search: { ref: value } });
    mutation.mutate(value);
  }

  const confirmed = booking && ["confirmed", "checked_in", "checked_out"].includes(booking.status);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-navy py-4 text-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-background/80 hover:text-background">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <p className="font-display text-lg">Mustay Luxury</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-gold">Reservation desk</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Check your booking</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter your booking number (MUSTAY-…) or your 6-digit verification code.
          </p>
        </div>

        <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="ref">Booking number or code</Label>
            <Input
              id="ref"
              value={reference}
              maxLength={40}
              onChange={(e) => setReference(e.target.value)}
              placeholder="MUSTAY-260830-1234"
            />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Search className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Searching…" : "Find"}
          </Button>
        </form>

        {searched && !booking && (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-border bg-card p-6 text-center">
            <XCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No reservation found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Double-check your reference, or contact reception on WhatsApp.
            </p>
          </div>
        )}

        {booking && (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 bg-navy px-5 py-4 text-background">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">Booking</p>
                <p className="font-display text-2xl">{booking.booking_number}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  confirmed ? "bg-emerald-500/20 text-emerald-300" : "bg-gold/20 text-gold"
                }`}
              >
                {confirmed ? <BadgeCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
              </span>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Guest" value={booking.guest_name} />
              <Field label="Room type" value={booking.room_category} />
              <Field label="Room assignment" value={booking.room_number ?? "Assigned at confirmation"} />
              <Field label="Guests" value={String(booking.num_guests)} />
              <Field
                label="Check-in"
                value={`${formatDate(booking.check_in_date)} · ${formatTime(booking.check_in_time)}`}
              />
              <Field
                label="Check-out"
                value={`${formatDate(booking.check_out_date)} · ${formatTime(booking.check_out_time)}`}
              />
              <Field label="Total due" value={formatNLe(booking.total_amount)} />
              <Field
                label="Payment"
                value={booking.payment_status === "paid" ? "Paid" : "Pay upon arrival at hotel"}
              />
            </div>

            {confirmed && booking.verification_code && (
              <div className="mx-5 mb-5 rounded-lg border border-gold/40 bg-gold/10 p-5 text-center">
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
                  Verification code
                </p>
                <p className="font-display text-4xl font-semibold tracking-[0.3em] text-foreground">
                  {booking.verification_code}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Present this code at reception on arrival.
                </p>
              </div>
            )}

            <div className="border-t border-border p-5">
              <a
                href={whatsappLink(
                  HOTEL_WHATSAPP,
                  `Hello Mustay Luxury, this is ${booking.guest_name}. My booking ${booking.booking_number} is ${
                    BOOKING_STATUS_LABEL[booking.status] ?? booking.status
                  }.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <MessageCircle className="mr-2 h-4 w-4" /> Open confirmation on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
