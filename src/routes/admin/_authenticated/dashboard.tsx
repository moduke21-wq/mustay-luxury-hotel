import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BedDouble, CalendarCheck, CheckCircle2, Clock, Hammer, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { confirmBooking, getAdminOverview, updateBookingStatus } from "@/lib/admin.functions";
import { CONSTRUCTION_ROOMS, formatDate, formatNLe, formatTime } from "@/lib/hotel";

export const Route = createFileRoute("/admin/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — Mustay Luxury" },
      { name: "description", content: "Room occupancy, pending requests and daily metrics for Mustay Luxury staff." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Operations Dashboard — Mustay Luxury" },
      { property: "og:description", content: "Internal operations dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });
  const [assign, setAssign] = useState<Record<string, string>>({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] });

  const confirmMut = useMutation({
    mutationFn: (vars: { bookingId: string; roomId: string }) => confirmBooking({ data: vars }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.message);
      toast.success(`Confirmed — verification code ${res.code}`);
      invalidate();
    },
  });

  const statusMut = useMutation({
    mutationFn: (vars: { bookingId: string; status: "cancelled" | "no_show" }) =>
      updateBookingStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Booking updated");
      invalidate();
    },
  });

  const rooms = data?.rooms ?? [];
  const bookings = data?.bookings ?? [];
  const pending = bookings.filter((b) => b.status === "pending");
  const availableRooms = rooms.filter((r) => r.status === "available");
  const today = new Date().toISOString().slice(0, 10);
  const arrivalsToday = bookings.filter((b) => b.check_in_date === today && b.status === "confirmed");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Live overview of rooms and reservations.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={BedDouble} label="Active rooms" value={String(rooms.length)} />
        <Metric icon={Hammer} label="Under construction" value={String(CONSTRUCTION_ROOMS)} />
        <Metric icon={CheckCircle2} label="Available now" value={String(availableRooms.length)} />
        <Metric icon={Clock} label="Pending requests" value={String(pending.length)} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Pending requests</h2>
        {isLoading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && pending.length === 0 && (
          <p className="mt-3 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            No pending requests right now.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {pending.map((b) => {
            const matching = availableRooms.filter((r) => r.category === b.room_category);
            const options = matching.length > 0 ? matching : availableRooms;
            return (
              <article key={b.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{b.guest_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.booking_number} · {b.guest_phone}
                    </p>
                  </div>
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">Pending</span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>
                    {b.room_category} · {b.num_guests} guest{b.num_guests === 1 ? "" : "s"}
                  </span>
                  <span>Total {formatNLe(b.total_amount)}</span>
                  <span>
                    In {formatDate(b.check_in_date)} {formatTime(b.check_in_time)}
                  </span>
                  <span>
                    Out {formatDate(b.check_out_date)} {formatTime(b.check_out_time)}
                  </span>
                </div>
                {b.special_requests && (
                  <p className="mt-2 rounded-md bg-secondary p-2 text-xs">{b.special_requests}</p>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={assign[b.id] ?? ""}
                    onValueChange={(v) => setAssign((s) => ({ ...s, [b.id]: v }))}
                  >
                    <SelectTrigger className="sm:w-56">
                      <SelectValue placeholder="Assign a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          Room {r.room_number} — {r.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="bg-navy text-background hover:bg-navy/90"
                    disabled={!assign[b.id] || confirmMut.isPending}
                    onClick={() => confirmMut.mutate({ bookingId: b.id, roomId: assign[b.id]! })}
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" /> Confirm booking
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => statusMut.mutate({ bookingId: b.id, status: "cancelled" })}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Decline
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Arrivals today</h2>
        {arrivalsToday.length === 0 ? (
          <p className="mt-3 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            No confirmed arrivals scheduled for today.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {arrivalsToday.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <span className="font-medium">{b.guest_name}</span>
                <span className="text-xs text-muted-foreground">
                  Room {b.room_number ?? "—"} · code {b.verification_code ?? "—"} ·{" "}
                  {formatTime(b.check_in_time)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
