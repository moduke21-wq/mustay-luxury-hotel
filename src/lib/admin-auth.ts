type RoleClient = {
  rpc: (
    functionName: "has_role",
    args: { _user_id: string; _role: "admin" },
  ) => PromiseLike<{ data: unknown; error?: { message?: string } | null }>;
};

export async function assertAdmin(supabase: RoleClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) {
    throw new Error("Forbidden: administrator access required.");
  }
}

export async function isAdmin(supabase: RoleClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !error && data === true;
}

export async function assertStaffOrAdmin(supabase: RoleClient, userId: string) {
  const admin = await isAdmin(supabase, userId);
  if (admin) return;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "staff" as never,
  });
  if (error || data !== true) throw new Error("Forbidden: staff access required.");
}
