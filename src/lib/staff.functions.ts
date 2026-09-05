import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { auth } from "@/lib/better-auth";
import { requireAdminSession } from "@/lib/better-auth.functions";

export const OWNER_EMAIL = "mustaybookkeepingservices@gmail.com";

export type StaffMember = {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  createdAt: string;
  isOwner: boolean;
  bannedUntil: string | null;
  lastSignInAt: string | null;
};

function requestHeaders() {
  return getRequest().headers;
}

function toStaffMember(user: {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  createdAt: Date;
  banned?: boolean | null;
  banExpires?: Date | null;
  lastLoginAt?: Date | null;
}): StaffMember {
  return {
    id: user.id,
    email: user.email,
    fullName: user.name || null,
    roles: user.role ? String(user.role).split(",").filter(Boolean) : [],
    createdAt: new Date(user.createdAt).toISOString(),
    isOwner: user.email.toLowerCase() === OWNER_EMAIL,
    bannedUntil: user.banned && user.banExpires ? new Date(user.banExpires).toISOString() : null,
    lastSignInAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
  };
}

export const listStaff = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const result = await auth.api.listUsers({
    headers: requestHeaders(),
    query: { limit: 1000, sortBy: "createdAt", sortDirection: "asc" },
  });
  return result.users.map(toStaffMember);
});

export const inviteOwner = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdminSession();
  const existing = await auth.api.listUsers({
    headers: requestHeaders(),
    query: {
      searchValue: OWNER_EMAIL,
      searchField: "email",
      searchOperator: "contains",
      limit: 10,
    },
  });
  if (existing.users.some((user) => user.email.toLowerCase() === OWNER_EMAIL)) {
    return {
      ok: false as const,
      message: "That owner account already exists. Use the existing account to sign in.",
    };
  }

  const bootstrapPassword = process.env.OWNER_INITIAL_PASSWORD;
  if (!bootstrapPassword) {
    return {
      ok: false as const,
      message: "Owner setup is unavailable until OWNER_INITIAL_PASSWORD is configured.",
    };
  }

  const created = await auth.api.createUser({
    body: {
      email: OWNER_EMAIL,
      password: bootstrapPassword,
      name: "Mustay Luxury Owner",
      role: "super_admin",
    },
  });
  return {
    ok: true as const,
    message: "Super Admin created. Sign in and change the temporary setup password immediately.",
    userId: created.user.id,
  };
});

export const createStaff = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        fullName: z.string().trim().max(120).optional().or(z.literal("")),
        role: z.enum(["admin", "manager", "receptionist"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    try {
      const created = await auth.api.createUser({
        headers: requestHeaders(),
        body: {
          email: data.email.toLowerCase(),
          password: data.password,
          name: data.fullName || data.email.toLowerCase(),
          role: data.role,
        },
      });
      return { ok: true as const, userId: created.user.id };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Could not create account.",
      };
    }
  });

export const setStaffRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ userId: z.string().min(1), role: z.enum(["admin", "manager", "receptionist"]) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    try {
      await auth.api.setRole({
        headers: requestHeaders(),
        body: { userId: data.userId, role: data.role },
      });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Could not update role.",
      };
    }
  });

export const setStaffPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().min(1), password: z.string().min(8).max(72) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    try {
      await auth.api.setUserPassword({ headers: requestHeaders(), body: data });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Could not change password.",
      };
    }
  });

export const setStaffBan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().min(1), banned: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    if (data.userId === session.user.id)
      return { ok: false as const, message: "You cannot ban your own account." };
    const users = await auth.api.listUsers({ headers: requestHeaders(), query: { limit: 1000 } });
    const target = users.users.find((user) => user.id === data.userId);
    if (!target) return { ok: false as const, message: "Account not found." };
    if (target.email.toLowerCase() === OWNER_EMAIL)
      return { ok: false as const, message: "The owner account cannot be banned." };
    try {
      if (data.banned)
        await auth.api.banUser({
          headers: requestHeaders(),
          body: { userId: data.userId, banReason: "Disabled by administrator" },
        });
      else await auth.api.unbanUser({ headers: requestHeaders(), body: { userId: data.userId } });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Could not update account access.",
      };
    }
  });

export const removeStaff = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ userId: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    if (data.userId === session.user.id)
      return { ok: false as const, message: "You cannot remove your own account." };
    const users = await auth.api.listUsers({ headers: requestHeaders(), query: { limit: 1000 } });
    const target = users.users.find((user) => user.id === data.userId);
    if (!target) return { ok: false as const, message: "Account not found." };
    if (target.email.toLowerCase() === OWNER_EMAIL)
      return { ok: false as const, message: "The owner account cannot be removed." };
    try {
      await auth.api.removeUser({ headers: requestHeaders(), body: { userId: data.userId } });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Could not remove account.",
      };
    }
  });
