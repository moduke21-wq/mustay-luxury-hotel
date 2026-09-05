import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/better-auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      throw new Error("Unauthorized: Invalid or expired session. Please sign in again.");
    }

    const roleClient = Object.assign(supabaseAdmin, {
      rpc: async (_functionName: "has_role", args: { _user_id: string; _role: "admin" }) => ({
        data:
          args._user_id === session.user.id &&
          ["admin", "super_admin"].includes(String(session.user.role)) &&
          args._role === "admin",
        error: null,
      }),
    });

    return next({
      context: {
        supabase: roleClient,
        userId: session.user.id,
        claims: { sub: session.user.id, email: session.user.email, role: session.user.role },
      },
    });
  },
);
