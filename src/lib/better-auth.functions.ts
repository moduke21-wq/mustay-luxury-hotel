import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/better-auth";

export const getBetterAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  return auth.api.getSession({ headers: request.headers });
});

export const requireAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  const role = String(session?.user?.role ?? "");
  if (!session?.user || !["super_admin", "admin"].includes(role)) {
    throw new Error("Unauthorized");
  }
  return { user: session.user };
});
