import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import "@/landing.css";

import heroImg from "@/assets/mustay/hero.asset.json";
import standardImg from "@/assets/mustay/standard-room.asset.json";
import deluxeImg from "@/assets/mustay/deluxe-room.asset.json";
import expansionMain from "@/assets/mustay/expansion-main.asset.json";
import expansionFront from "@/assets/mustay/expansion-front.asset.json";
import galleryExterior from "@/assets/mustay/gallery-exterior.asset.json";
import galleryTv from "@/assets/mustay/gallery-tv.asset.json";
import galleryBathroom from "@/assets/mustay/gallery-bathroom.asset.json";
import galleryBed from "@/assets/mustay/gallery-bed.asset.json";
import galleryChandelier from "@/assets/mustay/gallery-chandelier.asset.json";
import galleryHallway from "@/assets/mustay/gallery-hallway.asset.json";
import galleryCeiling from "@/assets/mustay/gallery-ceiling.asset.json";
import galleryBed2 from "@/assets/mustay/gallery-bed2.asset.json";

import { getPublicRooms, createGuestBooking } from "@/lib/public.functions";
import { getSiteSettings } from "@/lib/settings.functions";
import { HOTEL_WHATSAPP, nightsBetween } from "@/lib/hotel";

const roomsQuery = queryOptions({
  queryKey: ["public-rooms"],
  queryFn: () => getPublicRooms(),
});

const settingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: () => getSiteSettings(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(roomsQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Mustay Luxury Hotel — Bo City, Sierra Leone" },
      {
        name: "description",
        content:
          "Mustay Luxury Hotel on Abu Street, Shelmingo, Bo City. Air-conditioned rooms with 24-hour power, Wi-Fi and warm hospitality. Book on WhatsApp — pay at the hotel.",
      },
      { property: "og:title", content: "Mustay Luxury Hotel — Bo City, Sierra Leone" },
      {
        property: "og:description",
        content:
          "A peaceful, comfortable place to relax in the heart of Bo City. Standard Rooms Le 700, Deluxe Rooms Le 800 per night.",
      },
    ],
  }),
  component: LandingPage,
});

/* ---------------------------------- data ---------------------------------- */

const COUNTRIES = [
  { name: "Sierra Leone", currency: "SLE", symbol: "Le", rate: 1 },
  { name: "United States", currency: "USD", symbol: "$", rate: 0.043 },
  { name: "United Kingdom", currency: "GBP", symbol: "£", rate: 0.034 },
  { name: "Nigeria", currency: "NGN", symbol: "₦", rate: 65 },
  { name: "Ghana", currency: "GHS", symbol: "GH₵", rate: 0.6 },
  { name: "Liberia", currency: "LRD", symbol: "L$", rate: 8.3 },
  { name: "Guinea", currency: "GNF", symbol: "FG", rate: 370 },
  { name: "Ireland", currency: "EUR", symbol: "€", rate: 0.04 },
  { name: "Germany", currency: "EUR", symbol: "€", rate: 0.04 },
  { name: "Canada", currency: "CAD", symbol: "CA$", rate: 0.059 },
  { name: "Other / Not Listed", currency: "USD", symbol: "$", rate: 0.043 },
];

interface RoomShowcase {
  /** key used by the modal */
  id: "standard" | "deluxe";
  /** DB category sent to the booking backend */
  dbCategory: "Standard Room" | "Deluxe Suite";
  display: string;
  price: number;
  fallbackImage: string;
  tagline: string;
  description: string;
  features: string[];
}

const ROOM_SHOWCASE: RoomShowcase[] = [
  {
    id: "standard",
    dbCategory: "Standard Room",
    display: "Standard Room",
    price: 700,
    fallbackImage: standardImg.url,
    tagline: "Sleeps 2 guests",
    description:
      "A comfortable room with everything you need for a relaxed stay in Bo City, including reliable 24/7 power and water.",
    features: [
      "24/7 power & water",
      "Free Wi-Fi",
      "Smart TV",
      "Air conditioning",
      "Private bathroom",
    ],
  },
  {
    id: "deluxe",
    dbCategory: "Deluxe Suite",
    display: "Deluxe Room",
    price: 800,
    fallbackImage: deluxeImg.url,
    tagline: "Sleeps 2 guests",
    description:
      "A larger room with all the core Standard Room comforts, plus upgraded features for a more comfortable stay.",
    features: [
      "24/7 power & water",
      "Free Wi-Fi",
      "Breakfast included (mornings only)",
      "4K Smart TV",
      "Advanced air conditioning",
      "Seating area",
      "Mini-fridge",
      "Work desk",
      "Upgraded bathroom",
    ],
  },
];

const GALLERY = [
  { src: galleryExterior.url, alt: "Mustay Luxury Hotel exterior", cat: "exterior", label: "Exterior" },
  { src: galleryTv.url, alt: "Room with television", cat: "rooms", label: "Rooms" },
  { src: galleryBathroom.url, alt: "Bathroom", cat: "rooms", label: "Rooms" },
  { src: galleryBed.url, alt: "Guest bed", cat: "rooms", label: "Rooms" },
  { src: galleryChandelier.url, alt: "Chandelier detail", cat: "interior", label: "Interior" },
  { src: galleryHallway.url, alt: "Hallway ceiling", cat: "interior", label: "Interior" },
  { src: galleryCeiling.url, alt: "Ceiling light detail", cat: "interior", label: "Interior" },
  { src: galleryBed2.url, alt: "Guest bed", cat: "rooms", label: "Rooms" },
];

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#rooms", label: "Rooms" },
  { href: "#about", label: "About" },
  { href: "#dining", label: "Dining" },
  { href: "#services", label: "Services" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const CheckIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PhoneIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.12h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.15-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.31c-.23.24-.86.85-.86 2.06 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.19-.06-.1-.22-.16-.47-.28z" />
  </svg>
);

/* --------------------------------- page ----------------------------------- */

function LandingPage() {
  const { data } = useSuspenseQuery(roomsQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);

  const WA = (settings["whatsapp_number"] || HOTEL_WHATSAPP).replace(/\D/g, "");
  const WA_ENQUIRE = `https://wa.me/${WA}?text=${encodeURIComponent(
    "Hello Mustay Luxury Hotel, I'd like to enquire about a stay.",
  )}`;
  const phone1 = settings["phone_primary"] || "+232 79 494-545";
  const phone2 = settings["phone_secondary"] || "+232 72 080-818";
  const tel = (v: string) => `tel:${v.replace(/[^\d+]/g, "")}`;
  const address = settings["address"] || "Abu Street, Shelmingo, Manjama Section, Bo City, Sierra Leone";
  const heroTitle = settings["hero_title"] || "Welcome to Mustay Luxury Hotel";
  const heroSubtitle = settings["hero_subtitle"] || "Luxury, comfort & quality time in Bo City";
  const aboutText = settings["about_text"] || "";
  const expansionText = settings["expansion_text"] || "";

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [galleryFilter, setGalleryFilter] = useState("all");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [modalRoom, setModalRoom] = useState<RoomShowcase | null>(null);

  // booking form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Sierra Leone");
  const [roomId, setRoomId] = useState<"" | "standard" | "deluxe">("");
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(todayISO(1));
  const [guests, setGuests] = useState("2");
  const [message, setMessage] = useState("");
  const [formStatus, setFormStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const selectedRoom = ROOM_SHOWCASE.find((r) => r.id === roomId) ?? null;
  const selectedCountry = COUNTRIES.find((c) => c.name === country) ?? {
    name: "Sierra Leone",
    currency: "SLE",
    symbol: "Le",
    rate: 1,
  };

  const priceNote = useMemo(() => {
    if (!country || !selectedRoom) return "Select a country and room type to see the price.";
    const value = selectedRoom.price * selectedCountry.rate;
    const rounded = value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
    return `${selectedRoom.display}: approx. ${selectedCountry.symbol}${rounded.toLocaleString()} ${selectedCountry.currency} per night (shown in your local currency).`;
  }, [country, selectedRoom, selectedCountry]);

  // scroll-spy
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const sections = document.querySelectorAll(".mustay-landing section[id]");
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => spy.observe(s));
    return () => spy.disconnect();
  }, []);

  // best-effort country detection
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        clearTimeout(timeout);
        const detected: unknown = d?.country_name;
        if (typeof detected === "string" && COUNTRIES.some((c) => c.name === detected)) {
          setCountry(detected);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // lock body scroll when modal/lightbox open
  useEffect(() => {
    document.body.style.overflow = modalRoom || lightbox ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalRoom, lightbox]);

  // escape closes overlays
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalRoom(null);
        setLightbox(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createGuestBooking>[0]) => createGuestBooking(payload),
  });

  function bookRoom(room: RoomShowcase) {
    setRoomId(room.id);
    setModalRoom(null);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !country || !selectedRoom) {
      setFormStatus({ kind: "error", text: "Please fill in your name, phone, country, and room type." });
      return;
    }
    if (phone.replace(/\D/g, "").length < 6) {
      setFormStatus({ kind: "error", text: "Please enter a valid phone / WhatsApp number." });
      return;
    }
    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1) {
      setFormStatus({ kind: "error", text: "Check-out must be after check-in." });
      return;
    }
    const numGuests = guests === "5+" ? 6 : Number(guests);
    const specialRequests = [
      message.trim(),
      `Country: ${country}`,
      `Approx. price shown to guest: ${priceNote}`,
    ]
      .filter(Boolean)
      .join(" | ");

    mutation.mutate(
      {
        data: {
          guestName: name.trim(),
          guestPhone: phone.trim(),
          roomCategory: selectedRoom.dbCategory,
          checkInDate: checkIn,
          checkInTime: "14:00",
          checkOutDate: checkOut,
          numGuests,
          specialRequests,
        },
      },
      {
        onSuccess: (res) => {
          if (!res.ok) {
            setFormStatus({ kind: "error", text: res.message });
            return;
          }
          const lines = [
            "Hello Mustay Luxury Hotel, I'd like to request a room booking.",
            "",
            `Booking Reference: ${res.bookingNumber}`,
            `Name: ${name.trim()}`,
            `Phone: ${phone.trim()}`,
            `Country: ${country}`,
            `Room Type: ${selectedRoom.display}`,
            `Check-in: ${checkIn}`,
            `Check-out: ${checkOut}`,
            `Guests: ${guests}`,
            `Message: ${message.trim() || "None"}`,
            "",
            "(I understand this booking is confirmed only once the manager confirms availability.)",
          ];
          window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
          setFormStatus({
            kind: "success",
            text: `Request received! Your booking reference is ${res.bookingNumber}. Opening WhatsApp — please send the message so our manager can confirm availability.`,
          });
          setName("");
          setPhone("");
          setMessage("");
        },
        onError: () => setFormStatus({ kind: "error", text: "Something went wrong. Please try again." }),
      },
    );
  }

  // live images from the admin photo manager override the design fallbacks
  function roomImage(room: RoomShowcase) {
    const cat = data.categories.find((c) => c.category === room.dbCategory);
    return cat?.images?.[0] || room.fallbackImage;
  }

  const galleryItems = GALLERY.filter((g) => galleryFilter === "all" || g.cat === galleryFilter);

  return (
    <div className="mustay-landing">
      {/* NAV */}
      <header className="site">
        <nav className="nav">
          <a href="#home" className="brand" aria-label="Mustay Luxury Hotel — Home">
            Mustay <span>Luxury</span>
          </a>
          <ul className={`navlinks${menuOpen ? " open" : ""}`} id="primaryNav">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={activeSection === l.href.slice(1) ? "active" : ""}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/booking-status" onClick={() => setMenuOpen(false)}>
                My Booking
              </Link>
            </li>
          </ul>
          <div className="nav-right">
            <a href="#contact" className="navcta">
              Book Now
            </a>
            <button
              className="menu-btn"
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              aria-controls="primaryNav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="hero-eyebrow">Bo City, Sierra Leone</div>
          <h1>Welcome to Mustay Luxury Hotel</h1>
          <div className="hero-sub">Luxury, comfort &amp; quality time in Bo City</div>
          <p className="hero-desc">
            A peaceful and comfortable place to relax, enjoy quality time with your loved ones, and
            experience warm hospitality in the heart of Bo City.
          </p>
          <div className="hero-actions">
            <a href="#contact" className="btn-primary">
              Book Your Stay
            </a>
            <a href={WA_ENQUIRE} target="_blank" rel="noopener" className="btn-ghost">
              WhatsApp Us
            </a>
          </div>
          <div className="hero-location">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.3" />
            </svg>
            Abu Street, Shelmingo, Manjama Section, Bo City, Sierra Leone
          </div>
        </div>
        <div className="hero-photo">
          <img src={heroImg.url} alt="Mustay Luxury Hotel exterior" style={{ position: "absolute", inset: 0 }} />
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="highlights" id="services">
        <div className="highlights-row">
          <div className="highlight">
            <div className="highlight-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
              </svg>
            </div>
            <h3>24-Hour Electricity</h3>
            <p>Enjoy reliable electricity throughout your stay.</p>
          </div>
          <div className="highlight">
            <div className="highlight-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v3M5 12H2M22 12h-3M6.3 6.3 4.2 4.2M17.7 6.3l2.1-2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              </svg>
            </div>
            <h3>Air-Conditioned Rooms</h3>
            <p>Comfortable rooms designed for a relaxing stay.</p>
          </div>
          <div className="highlight">
            <div className="highlight-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8.5a16 16 0 0 1 20 0M5.5 12a11 11 0 0 1 13 0M9 15.5a6 6 0 0 1 6 0M12 19h.01" />
              </svg>
            </div>
            <h3>Wi-Fi</h3>
            <p>Stay connected during your visit.</p>
          </div>
          <div className="highlight">
            <div className="highlight-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 10h16M6 10V4h2v6M10 10V4h2v6M6 10v10M18 10v10M6 20h12" />
              </svg>
            </div>
            <h3>
              Club &amp; Restaurant{" "}
              <span style={{ color: "var(--gold)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em" }}>
                — Coming Soon
              </span>
            </h3>
            <p>Part of our new building, currently under construction.</p>
          </div>
        </div>
      </section>

      {/* WELCOME */}
      <section className="welcome" id="about">
        <div className="container welcome-grid">
          <h2>A comfortable stay. A memorable experience.</h2>
          <div className="welcome-right">
            <p>
              Mustay Luxury Hotel is located at Abu Street in the Shelmingo area of Manjama Section, Bo
              City, Sierra Leone. Whether you're visiting Bo for business, spending time with family,
              enjoying a getaway with your loved ones, or simply looking for a quiet place to relax,
              Mustay Luxury Hotel provides comfortable accommodation and warm hospitality.
            </p>
            <a href="#rooms" className="btn-outline">
              Discover Mustay
            </a>
          </div>
        </div>
      </section>

      {/* ROOMS */}
      <section className="rooms" id="rooms">
        <div className="container">
          <div className="rooms-head">
            <h2>Our Rooms</h2>
            <p>Comfortable accommodation designed for your stay in Bo City.</p>
          </div>
          <div className="rooms-grid">
            {ROOM_SHOWCASE.map((room) => (
              <div
                key={room.id}
                className="room-card"
                tabIndex={0}
                role="button"
                aria-haspopup="dialog"
                aria-label={`View ${room.display} details`}
                onClick={() => setModalRoom(room)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setModalRoom(room);
                  }
                }}
              >
                <img src={roomImage(room)} alt={`${room.display}, Le ${room.price} per night`} />
                <div className="room-tag">Le {room.price} / night</div>
                <div className="room-info">
                  <div>
                    <h3>{room.display}</h3>
                    <p>{room.tagline}</p>
                  </div>
                  <div className="room-actions">
                    <a
                      href="#"
                      className="view"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setModalRoom(room);
                      }}
                    >
                      View Room
                    </a>
                    <a
                      href="#contact"
                      className="book"
                      onClick={(e) => {
                        e.stopPropagation();
                        bookRoom(room);
                      }}
                    >
                      Book Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DINING BAND */}
      <section className="dining-band" id="dining">
        <div className="container dining-inner">
          <div>
            <div className="status-tag on-dark">Under Construction</div>
            <h2>Club &amp; Restaurant</h2>
            <p>
              Our Club &amp; Restaurant will be part of the new Mustay building currently under
              construction in Bo City — not yet open. We'll share updates as work progresses.
            </p>
          </div>
          <a
            href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi, I'd like updates on the Mustay Club & Restaurant in the new building.")}`}
            target="_blank"
            rel="noopener"
            className="btn-primary"
          >
            Get Updates
          </a>
        </div>
      </section>

      {/* EXPANSION */}
      <section className="expansion">
        <div className="container expansion-grid">
          <div className="expansion-photos">
            <div className="main-shot">
              <img
                src={expansionMain.url}
                alt="Mustay Luxury Hotel expansion under construction"
                style={{ position: "absolute", inset: 0 }}
              />
            </div>
            <div className="sub-shot">
              <img
                src={expansionFront.url}
                alt="Mustay Luxury Hotel expansion, front view"
                style={{ position: "absolute", inset: 0 }}
              />
            </div>
          </div>
          <div className="expansion-copy">
            <div className="status-tag">Under Construction</div>
            <h2>A New Chapter for Mustay</h2>
            <p>
              Work is underway on our next building in Bo City — a larger property designed to bring
              even more comfort to every stay, complete with a Club &amp; Restaurant and an elevator
              for easy access to every floor.
            </p>
            <div className="expansion-features">
              <div>
                <strong>34</strong>
                <span>Bedrooms</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Elevator</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Club &amp; Restaurant</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Conference Room</span>
              </div>
            </div>
            <a
              href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi, I'd like updates on the new Mustay Luxury Hotel building.")}`}
              target="_blank"
              rel="noopener"
              className="btn-outline"
            >
              Follow Our Progress
            </a>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery" id="gallery">
        <div className="container">
          <div className="gallery-head">
            <h2>Gallery</h2>
            <p>A closer look at Mustay Luxury Hotel — rooms, interiors and the exterior.</p>
            <div className="gallery-filters">
              {[
                { value: "all", label: "All" },
                { value: "rooms", label: "Rooms" },
                { value: "interior", label: "Interior" },
                { value: "exterior", label: "Exterior" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`g-filter${galleryFilter === value ? " active" : ""}`}
                  onClick={() => setGalleryFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="gallery-grid">
            {galleryItems.map((g) => (
              <div
                key={g.src}
                className="g-item"
                onClick={() => setLightbox({ src: g.src, alt: g.alt })}
              >
                <img src={g.src} alt={g.alt} loading="lazy" />
                <span className="g-cat">{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / BOOKING */}
      <section className="contact" id="contact">
        <div className="container contact-grid">
          <div className="contact-info">
            <div className="eyebrow">Reservations &amp; Enquiries</div>
            <h2>Reserve Your Stay</h2>
            <p>
              Get in touch to check availability, ask a question, or plan your visit — we're happy to
              help.
            </p>
            <div className="contact-cards">
              <a href="tel:+23279494545" className="contact-card">
                <span className="cc-icon">{PhoneIcon}</span>
                <span className="cc-text">
                  <span className="cc-label">Call Us</span>
                  <span className="cc-value">+232 79 494-545</span>
                </span>
              </a>
              <a href="tel:+23272080818" className="contact-card">
                <span className="cc-icon">{PhoneIcon}</span>
                <span className="cc-text">
                  <span className="cc-label">Call Us</span>
                  <span className="cc-value">+232 72 080-818</span>
                </span>
              </a>
              <a href={WA_ENQUIRE} target="_blank" rel="noopener" className="contact-card cc-whatsapp">
                <span className="cc-icon">{WhatsAppIcon}</span>
                <span className="cc-text">
                  <span className="cc-label">Fastest Response</span>
                  <span className="cc-value">Chat on WhatsApp</span>
                </span>
              </a>
            </div>
            <div className="contact-address">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.3" />
              </svg>
              Abu Street, Shelmingo, Manjama Section, Bo City, Sierra Leone
            </div>
          </div>

          <form className="contact-form" onSubmit={submit} noValidate>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="+232 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="country">Country</label>
                <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} required>
                  <option value="">Select your country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="roomType">Room Type</label>
                <select
                  id="roomType"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value as "standard" | "deluxe")}
                  required
                >
                  <option value="">Select a room</option>
                  {ROOM_SHOWCASE.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="checkIn">Check-in Date</label>
                <input
                  type="date"
                  id="checkIn"
                  value={checkIn}
                  min={todayISO()}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="checkOut">Check-out Date</label>
                <input
                  type="date"
                  id="checkOut"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field form-field-full" style={{ gridColumn: "1/-1" }}>
                <label htmlFor="guests">Number of Guests</label>
                <select id="guests" value={guests} onChange={(e) => setGuests(e.target.value)}>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5+">5+ Guests</option>
                </select>
              </div>
            </div>

            <div className="price-note">{priceNote}</div>

            <div className="form-field form-field-full">
              <label htmlFor="message">Are there any rooms available for my needs?</label>
              <textarea
                id="message"
                placeholder="Tell us about your stay, any special requests..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-whatsapp" disabled={mutation.isPending}>
              {WhatsAppIcon}
              {mutation.isPending ? "Sending…" : "Request on WhatsApp"}
            </button>
            <p className={`form-status${formStatus ? ` ${formStatus.kind}` : ""}`} role="status" aria-live="polite">
              {formStatus?.text}
            </p>

            <p className="confirm-note">
              Sending this request does not confirm your booking. Your reservation is only confirmed
              once our manager replies on WhatsApp and confirms room availability for your dates. No
              account, extra pages, or online payment is required. You can track your request anytime
              under <Link to="/booking-status" style={{ textDecoration: "underline" }}>My Booking</Link>.
            </p>
          </form>
        </div>
      </section>

      {/* LIGHTBOX */}
      <div
        className={`lightbox${lightbox ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setLightbox(null);
        }}
      >
        <button className="lightbox-close" onClick={() => setLightbox(null)}>
          &times;
        </button>
        {lightbox && <img src={lightbox.src} alt={lightbox.alt} />}
      </div>

      {/* ROOM MODAL */}
      <div className={`room-modal${modalRoom ? " open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="roomModalTitle">
        <div className="room-modal-backdrop" onClick={() => setModalRoom(null)} />
        {modalRoom && (
          <div className="room-modal-panel">
            <div className="room-modal-photo">
              <img src={roomImage(modalRoom)} alt={modalRoom.display} />
              <div className="room-modal-tag">Le {modalRoom.price} / night</div>
              <button className="room-modal-close" aria-label="Close room details" onClick={() => setModalRoom(null)}>
                &times;
              </button>
            </div>
            <div className="room-modal-body">
              <h3 id="roomModalTitle">{modalRoom.display}</h3>
              <p className="room-modal-meta">
                {modalRoom.tagline} &middot; Le {modalRoom.price} / night
              </p>
              <p className="room-modal-desc">{modalRoom.description}</p>
              <ul className="room-modal-features">
                {modalRoom.features.map((f) => (
                  <li key={f}>
                    {CheckIcon}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="room-modal-actions">
                <a
                  href="#contact"
                  className="btn-primary book"
                  onClick={(e) => {
                    e.preventDefault();
                    bookRoom(modalRoom);
                  }}
                >
                  Book Now
                </a>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ color: "var(--warm-white)" }}
                  onClick={() => setModalRoom(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WHATSAPP FAB */}
      <a href={WA_ENQUIRE} target="_blank" rel="noopener" className="whatsapp-fab" aria-label="Chat with us on WhatsApp">
        {WhatsAppIcon}
        <span className="wa-label">Chat on WhatsApp</span>
      </a>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>Mustay Luxury Hotel</h3>
              <p>
                Abu Street, Shelmingo, Manjama Section,
                <br />
                Bo City, Sierra Leone
                <br />
                <br />
                <a href="tel:+23279494545">+232 79 494-545</a>
                <br />
                <a href="tel:+23272080818">+232 72 080-818</a>
              </p>
            </div>
            <div className="footer-col">
              <h4>Explore</h4>
              <a href="#home">Home</a>
              <a href="#rooms">Rooms</a>
              <a href="#about">About</a>
              <a href="#dining">Dining</a>
            </div>
            <div className="footer-col">
              <h4>Visit</h4>
              <a href="#services">Services</a>
              <a href="#gallery">Gallery</a>
              <a href="#contact">Contact</a>
              <Link to="/booking-status">My Booking</Link>
            </div>
            <div className="footer-col">
              <h4>Management</h4>
              <Link to="/admin/login">Admin Panel</Link>
              <Link to="/admin/dashboard">Staff Dashboard</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Mustay Luxury Hotel. All Rights Reserved.</span>
            <Link to="/admin/login" style={{ color: "inherit", textDecoration: "underline" }}>
              Admin Panel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
