import { createServerFn } from "@tanstack/react-start";

async function authUser(accessToken: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data, error } = await externalAdmin.auth.getUser(accessToken);
  if (error || !data?.user) throw new Error("unauthenticated");
  return { user: data.user, externalAdmin };
}

export const listClienteProdutos = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string }) => {
    if (!i?.accessToken) throw new Error("accessToken obrigatório");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);

    // Resolve client ids
    const { data: links } = await externalAdmin
      .from("client_users")
      .select("client_id")
      .eq("user_id", user.id);
    let clientIds: string[] = (links ?? []).map((l: any) => l.client_id);
    if (clientIds.length === 0 && user.email) {
      const { data: cs } = await externalAdmin
        .from("clients")
        .select("id")
        .ilike("email", user.email.trim());
      clientIds = (cs ?? []).map((c: any) => c.id);
    }
    if (clientIds.length === 0) return { produtos: [], projeto: null };

    const { data: projects } = await externalAdmin
      .from("projects")
      .select("id, name")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false })
      .limit(1);
    const project = projects?.[0];
    if (!project) return { produtos: [], projeto: null };

    const { data: produtos } = await externalAdmin
      .from("project_products")
      .select(
        "id, name, description, category, store_name, store_url, image_url, price, currency, quantity, purchased, purchased_at, purchased_by, created_at",
      )
      .eq("project_id", project.id)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false });

    return {
      projeto: { id: project.id, name: project.name },
      produtos: produtos ?? [],
    };
  });

export const setClienteProdutoComprado = createServerFn({ method: "POST" })
  .inputValidator((i: { accessToken: string; productId: string; purchased: boolean }) => {
    if (!i?.accessToken) throw new Error("accessToken obrigatório");
    if (!i?.productId) throw new Error("productId obrigatório");
    return i;
  })
  .handler(async ({ data }) => {
    const { user, externalAdmin } = await authUser(data.accessToken);

    // Resolve client ids for this user
    const { data: links } = await externalAdmin
      .from("client_users")
      .select("client_id")
      .eq("user_id", user.id);
    let clientIds: string[] = (links ?? []).map((l: any) => l.client_id);
    if (clientIds.length === 0 && user.email) {
      const { data: cs } = await externalAdmin
        .from("clients")
        .select("id")
        .ilike("email", user.email.trim());
      clientIds = (cs ?? []).map((c: any) => c.id);
    }
    if (clientIds.length === 0) throw new Error("forbidden");

    // Verify product belongs to a project of this client and is visible to client
    const { data: produto } = await externalAdmin
      .from("project_products")
      .select("id, project_id, visible_to_client, projects:project_id(client_id)")
      .eq("id", data.productId)
      .maybeSingle();
    const projectClientId = (produto as any)?.projects?.client_id;
    if (!produto || !(produto as any).visible_to_client || !projectClientId || !clientIds.includes(projectClientId)) {
      throw new Error("forbidden");
    }

    const patch: any = {
      purchased: data.purchased,
      purchased_at: data.purchased ? new Date().toISOString() : null,
      purchased_by: data.purchased ? user.id : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await externalAdmin
      .from("project_products")
      .update(patch)
      .eq("id", data.productId);
    if (error) throw new Error(error.message);

    // Best-effort activity log
    try {
      await externalAdmin.from("project_product_activity").insert({
        product_id: data.productId,
        project_id: (produto as any).project_id,
        action: data.purchased ? "purchased" : "unpurchased",
        actor_role: "client",
        actor_user_id: user.id,
      });
    } catch {}

    return { ok: true };
  });
