import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  accessToken: z.string().min(10),
  clientId: z.string().uuid(),
  /** false = remover status VIP (mantém o login existente, apenas desativa o portal) */
  enabled: z.boolean().optional(),
});

/**
 * Cria (ou reaproveita) o usuário de autenticação do cliente para acesso ao
 * portal. Só o dono do escritório dono do cliente pode executar.
 * O cliente define a senha no primeiro acesso (fluxo de primeiro login).
 */
export const enableClientPortal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");

    const { data: u, error: uErr } = await externalAdmin.auth.getUser(data.accessToken);
    if (uErr || !u.user) throw new Error("Sessão expirada. Entre novamente.");

    const { data: client } = await externalAdmin
      .from("clients")
      .select("id, email, name, office_id")
      .eq("id", data.clientId)
      .maybeSingle();
    if (!client) throw new Error("Cliente não encontrado.");

    const { data: office } = await externalAdmin
      .from("offices")
      .select("id, owner_id")
      .eq("id", client.office_id)
      .maybeSingle();
    if (!office || office.owner_id !== u.user.id) throw new Error("Sem permissão.");

    if (data.enabled === false) {
      const { error } = await externalAdmin
        .from("clients")
        .update({ has_portal: false })
        .eq("id", client.id);
      if (error) throw new Error(error.message);
      return { ok: true as const, alreadyExisted: false, disabled: true as const, email: client.email ?? "" };
    }

    const email = (client.email ?? "").trim().toLowerCase();
    if (!email) throw new Error("Cadastre um e-mail para o cliente antes de criar o portal.");

    const created = await externalAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: client.name, role: "cliente" },
    });

    let alreadyExisted = false;
    if (created.error) {
      const { data: list } = await externalAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users.find((x) => (x.email ?? "").toLowerCase() === email);
      if (!found) throw new Error(created.error.message);
      alreadyExisted = true;
    }

    const { error: flagErr } = await externalAdmin
      .from("clients")
      .update({ has_portal: true })
      .eq("id", client.id);
    if (flagErr) throw new Error(flagErr.message);

    return { ok: true as const, alreadyExisted, disabled: false as const, email };
  });
