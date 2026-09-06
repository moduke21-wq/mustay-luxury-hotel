import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Ban, CheckCircle2, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStaff,
  inviteOwner,
  listStaff,
  removeStaff,
  setStaffBan,
  setStaffPassword,
  setStaffRole,
  type StaffMember,
} from "@/lib/staff.functions";

export const Route = createFileRoute("/admin/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Team & Admins — Mustay Luxury" },
      {
        name: "description",
        content: "Create and manage Mustay Luxury administrator and reception accounts.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Team & Admins — Mustay Luxury" },
      { property: "og:description", content: "Internal staff account management." },
    ],
  }),
  component: StaffPage,
});

const ROLES = ["admin", "manager", "receptionist"] as const;
type Role = (typeof ROLES)[number];

function StaffPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("admin");

  const ownerInviteMut = useMutation({
    mutationFn: () => inviteOwner({ data: undefined }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(
          res.invited
            ? "Owner setup invitation sent to mustaybookkeepingservices@gmail.com"
            : "Owner account is ready and has admin permissions",
        );
        invalidate();
      } else toast.error(res.message);
    },
    onError: (e: Error) => toast.error(e.message || "Could not process the owner invitation"),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createStaff({
        data: { email: email.trim().toLowerCase(), fullName: fullName.trim(), password, role },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Account created");
        setEmail("");
        setFullName("");
        setPassword("");
        invalidate();
      } else toast.error(res.message ?? "Could not create account");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-3xl font-semibold">Team & admins</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Administrators can edit prices, photos, WhatsApp numbers and all website text.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{(error as Error).message}</p>}

      <section className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Super Admin / Owner</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send a secure password setup invitation to mustaybookkeepingservices@gmail.com.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => ownerInviteMut.mutate()}
            disabled={ownerInviteMut.isPending}
          >
            {ownerInviteMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send owner invitation
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <UserPlus className="h-4 w-4 text-gold" /> Add a new team member
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="staff-name">Full name</Label>
            <Input id="staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="staff-password">Temporary password (min 8 characters)</Label>
            <Input
              id="staff-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="staff-role">Role</Label>
            <select
              id="staff-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "admin"
                    ? "Admin (full control)"
                    : r === "manager"
                      ? "Manager"
                      : "Receptionist"}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending || !email || password.length < 8}
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create account
          </Button>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading team…</p>}
        {(data ?? []).map((member) => (
          <StaffCard key={member.id} member={member} onChanged={invalidate} />
        ))}
      </section>
    </div>
  );
}

function StaffCard({ member, onChanged }: { member: StaffMember; onChanged: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const currentRole = (member.roles[0] as Role) ?? "receptionist";

  const roleMut = useMutation({
    mutationFn: (r: Role) => setStaffRole({ data: { userId: member.id, role: r } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Role updated");
        onChanged();
      } else toast.error(res.message ?? "Could not update role");
    },
  });

  const passwordMut = useMutation({
    mutationFn: () => setStaffPassword({ data: { userId: member.id, password: newPassword } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Password changed");
        setNewPassword("");
      } else toast.error(res.message ?? "Could not change password");
    },
  });

  const banMut = useMutation({
    mutationFn: (banned: boolean) => setStaffBan({ data: { userId: member.id, banned } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(member.bannedUntil ? "Account unbanned" : "Account banned");
        onChanged();
      } else toast.error(res.message ?? "Could not update account access");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: () => removeStaff({ data: { userId: member.id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Account removed");
        onChanged();
      } else toast.error(res.message ?? "Could not remove account");
    },
  });

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{member.fullName || member.email}</p>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {member.bannedUntil ? "Banned from signing in" : "Active"} ·{" "}
            {member.lastSignInAt
              ? `Last sign-in ${new Date(member.lastSignInAt).toLocaleDateString()}`
              : "Never signed in"}
          </p>
        </div>
        {member.isOwner && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-gold">
            <ShieldCheck className="h-3 w-3" /> Owner
          </span>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          value={currentRole}
          onChange={(e) => roleMut.mutate(e.target.value as Role)}
          disabled={member.isOwner}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Input
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            variant="outline"
            disabled={newPassword.length < 8 || passwordMut.isPending}
            onClick={() => passwordMut.mutate()}
          >
            Set
          </Button>
        </div>
      </div>

      {!member.isOwner && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => banMut.mutate(!member.bannedUntil)}
            disabled={banMut.isPending}
          >
            {member.bannedUntil ? (
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
            ) : (
              <Ban className="mr-1.5 h-4 w-4" />
            )}
            {member.bannedUntil ? "Unban account" : "Ban account"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-red-600 hover:bg-red-500/10 hover:text-red-600"
            onClick={() => removeMut.mutate()}
            disabled={removeMut.isPending}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Remove account
          </Button>
        </div>
      )}
    </article>
  );
}
