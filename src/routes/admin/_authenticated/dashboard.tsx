import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Image, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSiteMedia, getSiteSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/admin/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Mustay Luxury Hotel" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });
  const mediaQuery = useQuery({ queryKey: ["site-media"], queryFn: () => getSiteMedia() });
  const settings = settingsQuery.data ?? {};
  const media = mediaQuery.data ?? [];
  const loading = settingsQuery.isLoading || mediaQuery.isLoading;

  return (
    <div className="min-h-screen bg-background/95 px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Mustay Luxury Hotel</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Website dashboard</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Manage content that appears on the public hotel website. Every save is written to the live database.</p>
          </div>
          <Button asChild variant="outline"><Link to="/" target="_blank"><ExternalLink className="mr-2 h-4 w-4" />View live website</Link></Button>
        </header>
        {loading ? <p className="mt-6 text-sm text-muted-foreground">Loading live website content…</p> : null}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3"><Type className="h-5 w-5 text-gold" /><h2 className="font-display text-xl font-semibold">Website text</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Hotel name, hero copy, contact details, story, and other editable text.</p>
            <p className="mt-5 flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{Object.keys(settings).length} live fields connected</p>
            <Button asChild className="mt-5 bg-navy text-background hover:bg-navy/90"><Link to="/admin/settings">Edit website text</Link></Button>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3"><Image className="h-5 w-5 text-gold" /><h2 className="font-display text-xl font-semibold">Website images</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Upload and replace public images through the configured Supabase Storage bucket.</p>
            <p className="mt-5 flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{media.length} live images connected</p>
            <Button asChild variant="outline" className="mt-5"><Link to="/admin/settings">Manage images</Link></Button>
          </article>
        </section>
        <section className="mt-6 rounded-2xl border border-emerald-600/20 bg-emerald-600/5 p-5">
          <h2 className="font-display text-xl font-semibold">Live content status</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The public website reads the same Supabase PostgreSQL records that this dashboard updates. Normal content changes do not require a redeploy.</p>
        </section>
      </div>
    </div>
  );
}
