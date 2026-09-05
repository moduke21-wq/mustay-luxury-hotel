import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BedDouble, LayoutDashboard, LogOut, Search, Settings, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/_authenticated")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin/login" });
    if (!(await isAdmin(supabase, data.user.id))) throw redirect({ to: "/" });
    return { user: data.user };
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { to: "/admin/reception", label: "Reception", icon: Search },
  { to: "/admin/settings", label: "Website", icon: Settings },
  { to: "/admin/staff", label: "Team", icon: Users },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  const [adminBackground, setAdminBackground] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase
      .from("site_media" as never)
      .select("path")
      .eq("slot", "admin-background")
      .maybeSingle()
      .then(({ data }) => {
        if (active && data && typeof data === "object" && "path" in data) {
          setAdminBackground(String(data.path));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-secondary/40 pb-20 md:flex md:pb-0"
      style={
        adminBackground
          ? {
              backgroundImage: `linear-gradient(oklch(0.13 0.04 265 / 0.88), oklch(0.13 0.04 265 / 0.88)), url(${adminBackground})`,
              backgroundAttachment: "fixed",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
    >
      <aside className="hidden w-60 shrink-0 flex-col justify-between bg-navy p-5 text-background md:flex md:min-h-screen">
        <div>
          <p className="font-display text-xl font-semibold">Mustay Luxury</p>
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">Operations</p>
          <nav className="mt-8 space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-background/75 transition-colors hover:bg-background/10 hover:text-background"
                activeProps={{ className: "bg-gold/20 text-background" }}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
        </div>
        <Button
          variant="outline"
          onClick={signOut}
          className="border-background/30 bg-transparent text-background hover:bg-background/10"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </Button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-navy px-4 py-3 text-background md:hidden">
        <p className="font-display text-lg">Mustay Ops</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={signOut}
          className="text-background hover:bg-background/10"
        >
          <LogOut className="mr-1.5 h-4 w-4" /> Log out
        </Button>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-background md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 py-2.5 text-[0.65rem] text-muted-foreground"
            activeProps={{ className: "text-gold" }}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
