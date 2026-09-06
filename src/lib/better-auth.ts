import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../drizzle/auth-schema";

const databaseUrl = process.env.POSTGRES_URL;
const secret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl) throw new Error("POSTGRES_URL is required for Better Auth");
if (!secret) throw new Error("BETTER_AUTH_SECRET is required for Better Auth");

const sql = postgres(databaseUrl, { max: 5, prepare: false });
const db = drizzle(sql, { schema });

const origins = [
  "http://localhost:3000",
  process.env.V0_RUNTIME_URL,
  process.env.V0_DEV_APP_URL,
  process.env.V0_BUILD_URL,
  process.env.V0_SANDBOX_URL,
  "https://mustayluxury-hotel-1mdckte6a-duke-marketplace.vercel.app",
  "https://mustay-luxury-hotel.vercel.app",
  "https://mustayluxury-hotel.vercel.app",
  "https://*.v0.build",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
].filter((value): value is string => Boolean(value));

export const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.V0_RUNTIME_URL ?? undefined,
  trustedOrigins: origins,
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "staff", input: false },
    },
  },
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            role:
              user.email.toLowerCase() === "mustaybookkeepingservices@gmail.com"
                ? "super_admin"
                : (user.role ?? "staff"),
          },
        }),
      },
    },
  },
  plugins: [
    admin({
      adminRoles: ["admin", "super_admin"],
      defaultRole: "staff",
      roles: {
        admin: {},
        super_admin: {},
        staff: {},
        manager: {},
        receptionist: {},
      },
    }),
    tanstackStartCookies(),
  ],
  advanced: {
    defaultCookieAttributes: { sameSite: "none" as const, secure: true },
  },
});

export type BetterAuthSession = typeof auth.$Infer.Session;
