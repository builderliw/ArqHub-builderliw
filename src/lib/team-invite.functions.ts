import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { externalAdmin } from "@/integrations/external-supabase/admin.server";

const Input = z.object({
  accessToken: z.string().min(10),
  officeId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(6).max(128),
  position: z.string().trim().max(80).optional().nullable(),
});

export const inviteTeamMember = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    // valida caller
    const { data: u, error: uErr } = await externalAdmin.auth.getUser(data.accessToken);
    if (uErr || !u.user) throw new Error("Não autenticado.");
    const callerId = u.user.id;

    // confirma que é dono do escritório
    const { data: off } = await externalAdmin
      .from("offices").select("id, owner_id").eq("id", data.officeId).single();
    if (!off || off.owner_id !== callerId) throw new Error("Sem permissão.");

    // cria usuário com senha (idempotente: se já existe, reusa)
    let userId: string | null = null;
    const created = await externalAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (created.error) {
      // já existe — busca o id por listagem
      const { data: list } = await externalAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users.find((x) => (x.email ?? "").toLowerCase() === data.email);
      if (!found) throw new Error(created.error.message);
      userId = found.id;
    } else {
      userId = created.data.user?.id ?? null;
    }

    // upsert do membro
    const payload = {
      office_id: data.officeId,
      email: data.email,
      full_name: data.fullName,
      position: data.position ?? null,
      status: "active" as const,
      user_id: userId,
      joined_at: new Date().toISOString(),
    };
    const { error: insErr } = await externalAdmin
      .from("office_members")
      .upsert(payload, { onConflict: "office_id,email" });
    if (insErr) throw new Error(insErr.message);

    return { ok: true };
  });
