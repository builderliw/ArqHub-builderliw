import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ListInput = z.object({
  accessToken: z.string().min(10),
  projectId: z.string().min(1),
  limit: z.number().optional(),
});

async function auth(accessToken: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data, error } = await externalAdmin.auth.getUser(accessToken);
  if (error || !data?.user) throw new Error("Sessão expirada.");
  return { externalAdmin, user: data.user };
}

/**
 * Descobre o rótulo do ator (nome + cargo) para o log.
 * Dono do escritório => "Dono".
 * Membro ativo => "Nome, Cargo".
 */
export async function resolveActorLabel(
  externalAdmin: any,
  officeId: string,
  userId: string,
  fallbackEmail?: string | null,
): Promise<{ name: string; role: string }> {
  const { data: office } = await externalAdmin
    .from("offices").select("owner_id, name").eq("id", officeId).maybeSingle();
  if (office?.owner_id === userId) {
    return { name: office?.name ?? "Dono", role: "Dono" };
  }
  const { data: mem } = await externalAdmin
    .from("office_members")
    .select("full_name, position, email")
    .eq("office_id", officeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (mem) {
    return { name: mem.full_name ?? mem.email ?? fallbackEmail ?? "Membro", role: mem.position ?? "Membro" };
  }
  const { data: prof } = await externalAdmin
    .from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return { name: prof?.full_name ?? fallbackEmail ?? "Usuário", role: "Membro" };
}

/** Insere log de atividade. Chame do lado servidor, sempre com try/catch para não quebrar o fluxo principal. */
export async function logProjectActivity(
  externalAdmin: any,
  params: {
    projectId: string;
    officeId: string;
    userId: string;
    userEmail?: string | null;
    action: string;
    detail?: string;
  },
) {
  try {
    const label = await resolveActorLabel(externalAdmin, params.officeId, params.userId, params.userEmail);
    await externalAdmin.from("project_activity").insert({
      project_id: params.projectId,
      office_id: params.officeId,
      actor_id: params.userId,
      actor_name: label.name,
      actor_role: label.role,
      action: params.action,
      detail: params.detail ?? null,
    });
  } catch (err) {
    console.warn("[logProjectActivity] falhou", err);
  }
}

export const listProjectActivity = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data }) => {
    const { externalAdmin, user } = await auth(data.accessToken);
    const { data: project } = await externalAdmin
      .from("projects").select("id, office_id").eq("id", data.projectId).maybeSingle();
    if (!project?.office_id) throw new Error("Projeto não encontrado.");

    // acesso: dono ou membro ativo
    const { data: office } = await externalAdmin
      .from("offices").select("owner_id").eq("id", project.office_id).maybeSingle();
    if (office?.owner_id !== user.id) {
      const { data: mems } = await externalAdmin
        .from("office_members").select("id")
        .eq("office_id", project.office_id).eq("user_id", user.id).eq("status", "active").limit(1);
      if (!mems?.length) throw new Error("Sem acesso.");
    }

    const limit = Math.min(Math.max(data.limit ?? 100, 1), 300);
    const { data: rows, error } = await externalAdmin
      .from("project_activity")
      .select("id, actor_id, actor_name, actor_role, action, detail, created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return { activity: rows ?? [] };
  });
