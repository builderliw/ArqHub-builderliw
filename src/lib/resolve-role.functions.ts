import { createServerFn } from "@tanstack/react-start";

export const resolveUserRole = createServerFn({ method: "POST" })
  .inputValidator((input: { accessToken: string }) => {
    if (!input?.accessToken) throw new Error("accessToken obrigatório");
    return input;
  })
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: userData, error } = await externalAdmin.auth.getUser(data.accessToken);
    if (error || !userData?.user) return { ok: false as const, reason: "unauthenticated" as const };
    const user = userData.user;
    const email = (user.email ?? "").toLowerCase();

    // Admin?
    const { data: prof } = await externalAdmin
      .from("profiles")
      .select("is_admin_master, full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (prof?.is_admin_master) {
      return { ok: true as const, role: "admin" as const, name: prof.full_name ?? email, email };
    }

    // Profissional: ownership tem prioridade — dono do escritório vê tudo.
    // Só é tratado como membro quando NÃO é dono de nenhum escritório.
    const { data: owned } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    if (owned) {
      return { ok: true as const, role: "profissional" as const, name: prof?.full_name ?? email, email, officeId: owned.id };
    }
    const { data: member } = await externalAdmin
      .from("office_members")
      .select("office_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (member) {
      return { ok: true as const, role: "profissional" as const, name: prof?.full_name ?? email, email, officeId: member.office_id, isMember: true };
    }

    // Cliente?
    const { data: client } = await externalAdmin
      .from("clients")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (client) {
      return { ok: true as const, role: "cliente" as const, name: email.split("@")[0], email };
    }

    return { ok: false as const, reason: "no_role" as const };
  });
