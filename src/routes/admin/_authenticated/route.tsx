import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BedDouble,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
} from "lucide-react";

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
  { to: "/admin/reception", label: "Bookings", icon: Search },
  { to: "/admin/settings", label: "Website media", icon: Settings },
  { to: "/admin/staff", label: "Staff", icon: Users },
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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("mustay-admin-theme");
    const isDark = savedTheme === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    let active = true;
    void supabase
      .from("site_media" as never)
      .select("slot,path")
      .in("slot", ["admin-background", "admin-profile"])
      .then(({ data }) => {
        if (!active || !Array.isArray(data)) return;
        for (const item of data) {
          if (!item || typeof item !== "object" || !("slot" in item) || !("path" in item)) continue;
          if (item.slot === "admin-background") setAdminBackground(String(item.path));
          if (item.slot === "admin-profile") setProfilePhoto(String(item.path));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("mustay-admin-theme", next ? "dark" : "light");
  }

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
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-navy p-6 text-background md:flex md:min-h-screen">
        <div>
          <div className="border-b border-background/10 pb-6">
            <div className="flex items-center gap-3">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="CEO Mustapha"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-semibold text-gold-foreground">
                  CM
                </div>
              )}
              <div>
                <p className="font-semibold">CEO Mustapha</p>
                <p className="text-xs text-background/60">Administrator</p>
              </div>
            </div>
            <p className="mt-6 font-display text-2xl font-semibold tracking-wide">MUSTAY</p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.32em] text-gold">Luxury Hotel</p>
          </div>
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
        <p className="font-display text-lg">CEO Mustapha</p>
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
        <div className="hidden items-center justify-between border-b border-border/70 bg-background/90 px-8 py-4 backdrop-blur md:flex">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live operations
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">Mustay Luxury Hotel · CEO Mustapha</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
            >
              {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {darkMode ? "Light mode" : "Dark mode"}
            </Button>
          </div>
        </div>
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
