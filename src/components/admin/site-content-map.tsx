import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Image, LayoutTemplate, Menu, Phone, Search, Type } from "lucide-react";

const groups = [
  {
    title: "Homepage and navigation",
    description: "Hero headline, tagline, navigation labels, calls to action, and SEO metadata.",
    icon: LayoutTemplate,
    fields: ["Hero title", "Hero subtitle", "Navigation", "Book now button", "Page title and description"],
  },
  {
    title: "Rooms and booking",
    description: "All 12 active rooms, categories, prices, availability, amenities, and booking copy.",
    icon: Type,
    fields: ["12 room records", "Room photos", "Prices", "Amenities", "Booking form", "Booking status page"],
  },
  {
    title: "Story and construction",
    description: "About section, hotel story, expansion messaging, and construction progress details.",
    icon: Search,
    fields: ["About Mustay", "Expansion headline", "Expansion text", "Operational room count", "Future room count"],
  },
  {
    title: "Gallery and media",
    description: "The visual library for exterior, rooms, interiors, dining, services, and promotional sections.",
    icon: Image,
    fields: ["Hero image", "Room images", "Gallery images", "Image captions", "Alt text", "Display order"],
  },
  {
    title: "Contact and footer",
    description: "Phone numbers, WhatsApp, address, social links, opening information, and footer copy.",
    icon: Phone,
    fields: ["Primary phone", "Secondary phone", "WhatsApp", "Address", "Footer text"],
  },
];

export function SiteContentMap() {
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Full website control</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Every public section</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            This control center covers the whole website, not just operations. Use the sections below to see exactly what is managed from the admin area.
          </p>
        </div>
        <Link
          to="/"
          target="_blank"
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
        >
          View website <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {groups.map(({ title, description, icon: Icon, fields }) => (
          <article key={title} className="rounded-lg border border-border/80 bg-secondary/40 p-4">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gold" />
              <h3 className="font-medium">{title}</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {fields.map((field) => (
                <span key={field} className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">
                  {field}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
