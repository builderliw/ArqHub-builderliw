// Server-only helper — validates admin via external Supabase access token.
export async function assertAdminByToken(accessToken: string): Promise<{ userId: string; email: string | null }> {
  if (!accessToken || accessToken.length < 10) throw new Error("Não autenticado");
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data: userData, error: userErr } = await externalAdmin.auth.getUser(accessToken);
  if (userErr || !userData?.user?.id) throw new Error("Não autenticado");
  const { data: prof } = await externalAdmin
    .from("profiles")
    .select("is_admin_master")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!prof?.is_admin_master) throw new Error("Acesso restrito a administradores");
  return { userId: userData.user.id, email: userData.user.email ?? null };
}
