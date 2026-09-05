import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  DollarSign,
  Hammer,
  Image,
  Plus,
  Users,
  XCircle,
} from "lucide-react";
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
import { formatDate, formatNLe, formatTime } from "@/lib/hotel";

export const Route = createFileRoute("/admin/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mustay Luxury Hotel" },
      { name: "description", content: "Live hotel operations dashboard for Mustay Luxury Hotel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });
  const [assign, setAssign] = useState<Record<string, string>>({});
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  const confirmMut = useMutation({
    mutationFn: (vars: { bookingId: string; roomId: string }) => confirmBooking({ data: vars }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.message);
      toast.success("Booking confirmed");
      invalidate();
    },
  });
  const statusMut = useMutation({
    mutationFn: (vars: { bookingId: string; status: "cancelled" | "no_show" }) =>
      updateBookingStatus({ data: vars }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.message);
      toast.success("Booking updated");
      invalidate();
    },
  });

  const rooms = data?.rooms ?? [];
  const bookings = data?.bookings ?? [];
  const pending = bookings.filter((booking) => booking.status === "pending");
  const availableRooms = rooms.filter((room) => room.status === "available");
  const occupiedRooms = rooms.filter((room) => room.status === "occupied");
  const maintenanceRooms = rooms.filter((room) => room.status === "maintenance");
  const confirmedBookings = bookings.filter((booking) =>
    ["confirmed", "checked_in", "checked_out"].includes(booking.status),
  );
  const totalRevenue = confirmedBookings.reduce(
    (sum, booking) => sum + Number(booking.total_amount || 0),
    0,
  );
  const totalGuests = bookings.reduce((sum, booking) => sum + Number(booking.num_guests || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const arrivalsToday = bookings.filter(
    (booking) => booking.check_in_date === today && booking.status === "confirmed",
  );
  const recentBookings = bookings.slice(0, 6);

  const statusSummary = useMemo(
    () => [
      { label: "Available", value: availableRooms.length, className: "bg-gold" },
      { label: "Occupied", value: occupiedRooms.length, className: "bg-navy" },
      { label: "Maintenance", value: maintenanceRooms.length, className: "bg-muted-foreground" },
    ],
    [availableRooms.length, occupiedRooms.length, maintenanceRooms.length],
  );

  return (
    <div className="min-h-screen bg-background/95 px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              Mustay Luxury Hotel
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Good morning, operations team
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Live activity from reservations, rooms, and guest operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-navy text-background hover:bg-navy/90">
              <Link to="/admin/reception">
                <Plus className="mr-2 h-4 w-4" />
                New booking
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/settings">
                <Image className="mr-2 h-4 w-4" />
                Website media
              </Link>
            </Button>
          </div>
        </header>

        {isError ? (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Live dashboard data could not be loaded.
          </p>
        ) : null}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={CalendarCheck} label="Total bookings" value={bookings.length} />
          <Metric icon={Users} label="Guests in bookings" value={totalGuests} />
          <Metric icon={BedDouble} label="Total rooms" value={rooms.length} />
          <Metric icon={DollarSign} label="Recorded revenue" value={formatNLe(totalRevenue)} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">Room status</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current inventory state from the rooms table.
                </p>
              </div>
              <Link className="text-sm font-medium text-gold hover:underline" to="/admin/rooms">
                Manage rooms
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {statusSummary.map((item) => (
                <div key={item.label} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
                    {item.label}
                  </div>
                  <p className="mt-3 font-display text-3xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-xl font-semibold">Today</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <LiveStat icon={Clock3} label="Pending requests" value={pending.length} />
              <LiveStat icon={CheckCircle2} label="Arrivals today" value={arrivalsToday.length} />
              <LiveStat icon={Hammer} label="Rooms needing care" value={maintenanceRooms.length} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">Recent bookings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The latest live reservation records.
              </p>
            </div>
            <Link className="text-sm font-medium text-gold hover:underline" to="/admin/reception">
              Open reception
            </Link>
          </div>
          {isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading live records…</p>
          ) : recentBookings.length === 0 ? (
            <p className="mt-6 rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
              No bookings have been recorded yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Guest</th>
                    <th className="px-3 py-3">Room</th>
                    <th className="px-3 py-3">Check-in</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-4 font-medium">{booking.guest_name}</td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {booking.room_number
                          ? `Room ${booking.room_number}`
                          : booking.room_category}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {formatDate(booking.check_in_date)}
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">
                          {booking.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right font-medium">
                        {formatNLe(booking.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {pending.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">Pending requests</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Assign an available room before confirming.
                </p>
              </div>
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                {pending.length} waiting
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {pending.map((booking) => {
                const options = availableRooms.filter(
                  (room) => room.category === booking.room_category,
                );
                const roomOptions = options.length ? options : availableRooms;
                return (
                  <article key={booking.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium">{booking.guest_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.booking_number} · {booking.room_category} ·{" "}
                          {formatDate(booking.check_in_date)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Select
                          value={assign[booking.id] ?? ""}
                          onValueChange={(value) =>
                            setAssign((state) => ({ ...state, [booking.id]: value }))
                          }
                        >
                          <SelectTrigger className="sm:w-52">
                            <SelectValue placeholder="Assign room" />
                          </SelectTrigger>
                          <SelectContent>
                            {roomOptions.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                Room {room.room_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          disabled={!assign[booking.id] || confirmMut.isPending}
                          onClick={() =>
                            confirmMut.mutate({
                              bookingId: booking.id,
                              roomId: assign[booking.id]!,
                            })
                          }
                        >
                          <CalendarCheck className="mr-2 h-4 w-4" />
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            statusMut.mutate({ bookingId: booking.id, status: "cancelled" })
                          }
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
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
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="rounded-full bg-gold/15 p-2 text-gold">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
function LiveStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-gold" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <strong className="font-display text-2xl">{value}</strong>
    </div>
  );
}
