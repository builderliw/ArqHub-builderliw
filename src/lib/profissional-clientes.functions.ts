import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ accessToken: z.string().min(10) });

const DeleteInput = z.object({
  accessToken: z.string().min(10),
  clientId: z.string().uuid(),
});

export const deleteProfissionalCliente = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DeleteInput.parse(data))
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: auth, error: authError } = await externalAdmin.auth.getUser(data.accessToken);
    const user = auth?.user;
    if (authError || !user) throw new Error("Sessão expirada. Entre novamente.");

    const { data: offices } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", user.id);
    const officeIds = (offices ?? []).map((o: { id: string }) => o.id);
    if (officeIds.length === 0) throw new Error("Apenas o dono do escritório pode excluir clientes.");

    const { data: client, error: cErr } = await externalAdmin
      .from("clients")
      .select("id, office_id")
      .eq("id", data.clientId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!client || !officeIds.includes(client.office_id)) throw new Error("Cliente não encontrado.");

    const { error: delErr } = await externalAdmin
      .from("clients")
      .delete()
      .eq("id", data.clientId);
    if (delErr) throw new Error(delErr.message);

    return { ok: true };
  });

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  cidade?: string | null;
  uf?: string | null;
  rua?: string | null;
  numero?: string | null;
  cep?: string | null;
  bairro?: string | null;
  complemento?: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string | null;
  client_id: string | null;
  location: string | null;
  city: string | null;
  area_m2: number | null;
  created_at: string;
  description?: string | null;
  budget_cents?: number | null;
  deadline?: string | null;
  client_email?: string | null;
};

export const listProfissionalClientData = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: auth, error: authError } = await externalAdmin.auth.getUser(data.accessToken);
    const user = auth?.user;
    if (authError || !user) throw new Error("Sessão expirada. Entre novamente.");

    const { data: ownerOffices } = await externalAdmin
      .from("offices")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    let officeId = ownerOffices?.[0]?.id ?? null;
    let isOwner = !!officeId;
    let memberId: string | null = null;

    if (!officeId) {
      const email = normalizeEmail(user.email);
      const { data: members } = await externalAdmin
        .from("office_members")
        .select("id, office_id, status, user_id, email, allowed_modules")
        .or(`user_id.eq.${user.id},email.eq.${email}`)
        .limit(1);
      const member = members?.[0] ?? null;
      if (member) {
        // Server-side gate: members with a custom role must have "clientes" allowed.
        const allowed = (member as { allowed_modules?: string[] | null }).allowed_modules;
        if (allowed && !allowed.includes("clientes")) {
          throw new Error("Acesso negado ao módulo de clientes.");
        }
        officeId = member.office_id;
        memberId = member.id;
        if (!member.user_id || member.status !== "active") {
          await externalAdmin
            .from("office_members")
            .update({ user_id: user.id, status: "active", joined_at: new Date().toISOString() })
            .eq("id", member.id);
        }
      }
    }

    if (!officeId) {
      const metadata = user.user_metadata as Record<string, unknown>;
      const name = (metadata.name as string | undefined) || user.email || "Meu escritório";
      const { data: created, error } = await externalAdmin
        .from("offices")
        .insert({ owner_id: user.id, name })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      officeId = created?.id ?? null;
      isOwner = true;
    }

    if (!officeId) return { officeId: null, clientes: [], projetos: [] };

    if (isOwner) {
      const fullName =
        ((user.user_metadata as Record<string, unknown>).full_name as string | undefined) ||
        ((user.user_metadata as Record<string, unknown>).name as string | undefined) ||
        user.email ||
        "Dono";
      await externalAdmin.from("office_members").upsert(
        {
          office_id: officeId,
          user_id: user.id,
          email: user.email,
          full_name: fullName,
          position: "Dono",
          status: "active",
          joined_at: new Date().toISOString(),
        },
        { onConflict: "office_id,email" },
      );
    }

    const clientsVip = await externalAdmin
      .from("clients")
      .select(
        "id, name, email, phone, status, created_at, cidade, uf, rua, numero, cep, bairro, complemento, has_portal",
      )
      .eq("office_id", officeId)
      .order("name", { ascending: true });
    const clientsFull = clientsVip.error
      ? await externalAdmin
          .from("clients")
          .select(
            "id, name, email, phone, status, created_at, cidade, uf, rua, numero, cep, bairro, complemento",
          )
          .eq("office_id", officeId)
          .order("name", { ascending: true })
      : clientsVip;
    const clientsRes = clientsFull.error
      ? await externalAdmin
          .from("clients")
          .select("id, name, email, phone, status, created_at")
          .eq("office_id", officeId)
          .order("name", { ascending: true })
      : clientsFull;


    if (clientsRes.error) throw new Error(clientsRes.error.message);
    const clientes = (clientsRes.data ?? []) as ClientRow[];
    const clientById = new Map(clientes.map((client) => [client.id, client]));

    const projectsFull = await externalAdmin
      .from("projects")
      .select(
        "id, name, status, client_id, location, city, area_m2, created_at, description, budget_cents, deadline",
      )
      .eq("office_id", officeId)
      .order("created_at", { ascending: false });
    const projectsRes = projectsFull.error
      ? await externalAdmin
          .from("projects")
          .select("id, name, status, client_id, location, city, area_m2, created_at")
          .eq("office_id", officeId)
          .order("created_at", { ascending: false })
      : projectsFull;

    if (projectsRes.error) throw new Error(projectsRes.error.message);
    const projetos: ProjectRow[] = ((projectsRes.data ?? []) as ProjectRow[]).map((project) => ({
      ...project,
      client_email: normalizeEmail(clientById.get(project.client_id ?? "")?.email),
    }));

    return { officeId, clientes, projetos };
  });
