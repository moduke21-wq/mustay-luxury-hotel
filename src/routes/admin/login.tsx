import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Login — Mustay Luxury" },
      { name: "description", content: "Secure sign-in for Mustay Luxury reception and management staff." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Staff Login — Mustay Luxury" },
      { property: "og:description", content: "Secure sign-in for Mustay Luxury staff." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/admin/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold">Mustay Luxury</p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.3em] text-gold">Staff portal</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mustayluxury.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Sign in
          </Button>
        </form>

        <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:underline">
          Back to guest site
        </Link>
      </div>
    </div>
  );
}
