import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BedDouble,
  CalendarDays,
  Check,
  Hammer,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import heroImage from "@/assets/hero-mustay.jpg";
import { RoomPlaceholder } from "@/components/RoomPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPublicRooms, createGuestBooking } from "@/lib/public.functions";
import {
  CATEGORY_PRICES,
  CONSTRUCTION_ROOMS,
  HOTEL_TAGLINE,
  OPERATIONAL_ROOMS,
  formatNLe,
  nightsBetween,
} from "@/lib/hotel";

const roomsQuery = queryOptions({
  queryKey: ["public-rooms"],
  queryFn: () => getPublicRooms(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(roomsQuery),
  head: () => ({
    meta: [
      { title: "Mustay Luxury — Hotel Rooms & Booking in Sierra Leone" },
      {
        name: "description",
        content:
          "Book a Deluxe Suite or Standard Room at Mustay Luxury, Sierra Leone. 12 operational rooms, pay on arrival, instant WhatsApp confirmation.",
      },
      { property: "og:title", content: "Mustay Luxury — Your Home Away From Home" },
      {
        property: "og:description",
        content: "Deluxe Suites from NLe 800 and Standard Rooms from NLe 700. Reserve now, pay at the hotel.",
      },
    ],
  }),
  component: GuestPortal,
});

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function GuestPortal() {
  const { data } = useSuspenseQuery(roomsQuery);
  const [category, setCategory] = useState<"Deluxe Suite" | "Standard Room">("Deluxe Suite");
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(todayISO(1));
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState("");
  const [result, setResult] = useState<{ bookingNumber: string; totalAmount: number } | null>(null);

  const nights = nightsBetween(checkIn, checkOut);
  const estimate = useMemo(
    () => (CATEGORY_PRICES[category] ?? 700) * Math.max(1, nights),
    [category, nights],
  );

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createGuestBooking>[0]) => createGuestBooking(payload),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setResult({ bookingNumber: res.bookingNumber, totalAmount: res.totalAmount });
      toast.success("Request received!");
      setName("");
      setPhone("");
      setEmail("");
      setRequests("");
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 6) {
      toast.error("Please enter a valid WhatsApp number.");
      return;
    }
    if (nights < 1) {
      toast.error("Check-out must be after check-in.");
      return;
    }
    mutation.mutate({
      data: {
        guestName: name,
        guestPhone: phone,
        guestEmail: email,
        roomCategory: category,
        checkInDate: checkIn,
        checkInTime,
        checkOutDate: checkOut,
        numGuests: Number(guests),
        specialRequests: requests,
      },
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold">Mustay Luxury</p>
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">Sierra Leone</p>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/booking-status">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Search className="h-4 w-4" /> My booking
              </Button>
            </Link>
            <a href="#book">
              <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
                Book now
              </Button>
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <img
          src={heroImage}
          alt="Mustay Luxury hotel lit at dusk"
          width={1920}
          height={1088}
          className="h-[62vh] min-h-[420px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/60 to-navy/90" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-4">
            <p className="mb-3 text-[0.65rem] uppercase tracking-[0.35em] text-gold">
              Boutique hospitality
            </p>
            <h1 className="max-w-xl font-display text-4xl font-semibold leading-tight text-background sm:text-6xl">
              {HOTEL_TAGLINE}
            </h1>
            <p className="mt-4 max-w-md text-sm text-background/80 sm:text-base">
              Air-conditioned suites, en-suite comfort and warm reception service — reserve today and
              settle your bill when you arrive.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#rooms">
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                  Explore rooms
                </Button>
              </a>
              <Link to="/booking-status">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-background/40 bg-transparent text-background hover:bg-background/10"
                >
                  Check booking status
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING LOOKUP WIDGET */}
      <div className="mx-auto -mt-10 w-full max-w-6xl px-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xl sm:p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs text-muted-foreground">Check-in</Label>
              <Input type="date" value={checkIn} min={todayISO()} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Check-out</Label>
              <Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Guests</Label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <a href="#book" className="w-full">
                <Button className="w-full bg-navy text-background hover:bg-navy/90">
                  <CalendarDays className="mr-2 h-4 w-4" /> Check availability
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CAPACITY PILL */}
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {OPERATIONAL_ROOMS} Operational Rooms Available Now
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Hammer className="h-3.5 w-3.5 text-gold" />
          {CONSTRUCTION_ROOMS} Executive Rooms Under Construction
        </span>
      </div>

      {/* ROOMS */}
      <section id="rooms" className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-gold">Accommodation</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Our rooms</h2>
          <div className="gold-rule mx-auto mt-4 w-24" />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {data.categories.map((room) => (
            <article
              key={room.category}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
            >
              {room.images[0] ? (
                <img
                  src={room.images[0]}
                  alt={`${room.category} at Mustay Luxury`}
                  loading="lazy"
                  className="h-56 w-full object-cover"
                />
              ) : (
                <RoomPlaceholder label={room.category} className="h-56 w-full" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{room.category}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{room.bedType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold text-gold">
                      {formatNLe(room.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">per night</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-gold" /> Up to {room.capacity} guests
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BedDouble className="h-3.5 w-3.5 text-gold" /> {room.totalRooms} rooms
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold" /> {room.availableRooms} available now
                  </span>
                </div>

                <ul className="mt-4 grid grid-cols-2 gap-1.5 text-xs">
                  {room.amenities.slice(0, 6).map((a) => (
                    <li key={a} className="flex items-center gap-1.5 text-muted-foreground">
                      <Check className="h-3 w-3 shrink-0 text-gold" /> {a}
                    </li>
                  ))}
                </ul>

                <a href="#book">
                  <Button
                    className="mt-5 w-full bg-navy text-background hover:bg-navy/90"
                    onClick={() => setCategory(room.category as "Deluxe Suite" | "Standard Room")}
                  >
                    Book {room.category}
                  </Button>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* BOOKING FORM */}
      <section id="book" className="bg-navy py-14 text-background">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-gold">Reservation</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Request your stay</h2>
            <p className="mt-3 text-sm text-background/70">
              No card needed — reception confirms your room and you pay on arrival.
            </p>
          </div>

          {result ? (
            <div className="mt-8 rounded-xl border border-gold/40 bg-background/5 p-6 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-gold" />
              <h3 className="mt-3 font-display text-2xl">Request received!</h3>
              <p className="mt-2 text-sm text-background/80">
                Reception will confirm your reservation via WhatsApp shortly.
              </p>
              <p className="mt-5 text-xs uppercase tracking-[0.25em] text-gold">Booking number</p>
              <p className="font-display text-3xl font-semibold">{result.bookingNumber}</p>
              <p className="mt-3 text-sm text-background/80">
                Estimated total due at hotel: {formatNLe(result.totalAmount)}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/booking-status" search={{ ref: result.bookingNumber }}>
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
                    Track this booking
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-background/40 bg-transparent text-background hover:bg-background/10"
                  onClick={() => setResult(null)}
                >
                  Make another request
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl bg-background p-5 text-foreground sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cat">Room type</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                    <SelectTrigger id="cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deluxe Suite">Deluxe Suite — NLe 800/night</SelectItem>
                      <SelectItem value="Standard Room">Standard Room — NLe 700/night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="g">Guests</Label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger id="g">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "guest" : "guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ci">Check-in date</Label>
                  <Input id="ci" type="date" min={todayISO()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="cit">Check-in time</Label>
                  <Input id="cit" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="co">Check-out date</Label>
                  <Input id="co" type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="n">Full name</Label>
                  <Input id="n" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aminata Kamara" />
                </div>
                <div>
                  <Label htmlFor="p">WhatsApp number</Label>
                  <Input id="p" value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} placeholder="+232 __ ______" />
                </div>
                <div>
                  <Label htmlFor="e">Email (optional)</Label>
                  <Input id="e" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <Label htmlFor="r">Special requests</Label>
                <Textarea
                  id="r"
                  value={requests}
                  maxLength={600}
                  onChange={(e) => setRequests(e.target.value)}
                  placeholder="Airport pickup, extra bed, late arrival…"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
                <Wallet className="h-4 w-4 shrink-0 text-gold" />
                <span>
                  Payment method: <strong>Pay Upon Arrival at Hotel</strong>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {Math.max(1, nights)} night{nights === 1 ? "" : "s"} × {formatNLe(CATEGORY_PRICES[category] ?? 700)}
                </span>
                <span className="font-display text-xl font-semibold">{formatNLe(estimate)}</span>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {mutation.isPending ? "Sending request…" : "Request reservation"}
              </Button>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
          <div>
            <p className="font-display text-xl font-semibold">Mustay Luxury</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Boutique comfort, dependable service and a warm welcome in Sierra Leone.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" /> Sierra Leone
            </p>
            <p className="mt-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" /> Reception via WhatsApp
            </p>
          </div>
          <div className="text-sm">
            <Link to="/booking-status" className="text-muted-foreground underline-offset-4 hover:underline">
              Check booking status
            </Link>
            <br />
            <Link to="/admin/login" className="text-muted-foreground underline-offset-4 hover:underline">
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
