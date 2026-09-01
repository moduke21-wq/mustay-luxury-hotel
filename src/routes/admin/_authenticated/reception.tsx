import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DoorOpen, LogIn, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminOverview, updateBookingStatus } from "@/lib/admin.functions";
import { BOOKING_STATUS_LABEL, formatDate, formatNLe, formatTime } from "@/lib/hotel";

export const Route = createFileRoute("/admin/_authenticated/reception")({
  head: () => ({
    meta: [
      { title: "Reception Desk — Mustay Luxury" },
      { name: "description", content: "Search guests by name or verification code to check in and check out." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reception Desk — Mustay Luxury" },
      { property: "og:description", content: "Internal reception check-in desk." },
    ],
  }),
  component: Reception,
});

function Reception() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: () => getAdminOverview() });

  const mut = useMutation({
    mutationFn: (vars: { bookingId: string; status: "checked_in" | "checked_out"; markPaid?: boolean }) =>
      updateBookingStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Booking updated");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const results = useMemo(() => {
    const bookings = data?.bookings ?? [];
    const q = term.trim().toLowerCase();
    const active = bookings.filter((b) => !["cancelled", "no_show"].includes(b.status));
    if (!q) return active.slice(0, 12);
    return active.filter(
      (b) =>
        b.guest_name.toLowerCase().includes(q) ||
        b.booking_number.toLowerCase().includes(q) ||
        (b.verification_code ?? "").includes(q) ||
        b.guest_phone.includes(q) ||
        (b.room_number ?? "").includes(q),
    );
  }, [data, term]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="font-display text-3xl font-semibold">Reception desk</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search by guest name, room number, phone or 6-digit code.
      </p>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          maxLength={60}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. Aminata, 101 or 482913"
          className="pl-9"
        />
      </div>

      <div className="mt-5 space-y-3">
        {results.length === 0 && (
          <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            No matching reservations.
          </p>
        )}
        {results.map((b) => (
          <article key={b.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{b.guest_name}</p>
                <p className="text-xs text-muted-foreground">
                  {b.booking_number} · Room {b.room_number ?? "unassigned"} · code{" "}
                  {b.verification_code ?? "—"}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {BOOKING_STATUS_LABEL[b.status] ?? b.status}
              </span>
            </div>

            <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
              <span>
                In {formatDate(b.check_in_date)} {formatTime(b.check_in_time)}
              </span>
              <span>
                Out {formatDate(b.check_out_date)} {formatTime(b.check_out_time)}
              </span>
              <span>Total {formatNLe(b.total_amount)}</span>
              <span>{b.payment_status === "paid" ? "Paid" : "Pay at hotel"}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {b.status === "confirmed" && (
                <Button
                  className="bg-navy text-background hover:bg-navy/90"
                  disabled={mut.isPending}
                  onClick={() => mut.mutate({ bookingId: b.id, status: "checked_in", markPaid: true })}
                >
                  <LogIn className="mr-2 h-4 w-4" /> Mark paid & check in
                </Button>
              )}
              {b.status === "checked_in" && (
                <Button
                  variant="outline"
                  disabled={mut.isPending}
                  onClick={() => mut.mutate({ bookingId: b.id, status: "checked_out" })}
                >
                  <DoorOpen className="mr-2 h-4 w-4" /> Check out
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
