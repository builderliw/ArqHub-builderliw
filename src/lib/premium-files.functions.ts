import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/external-supabase/auth-middleware";

const BUCKET = "recursos-premium";
const VALID_SLUGS = [
  "orcamentos-inteligentes",
  "levantamento-quantitativo",
  "sugestao-de-compras",
  "planejamento-de-obra",
] as const;

async function assertAdmin(userId: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data } = await externalAdmin
    .from("profiles")
    .select("is_admin_master")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.is_admin_master) throw new Error("Acesso restrito a administradores");
}

export const listPremiumFiles = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data, error } = await supabaseAdmin
    .from("premium_recurso_files")
    .select("slug, filename, storage_path, size, content_type, updated_at");
  if (error) throw new Error(error.message);
  return { items: data ?? [] };
});

/** Assinatura ativa (ou trial válido) do escritório do usuário, ou admin master. */
async function assertPremiumAccess(accessToken: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data: userData } = await externalAdmin.auth.getUser(accessToken);
  const uid = userData?.user?.id;
  if (!uid) throw new Error("Faça login para baixar este material.");

  const { data: prof } = await externalAdmin
    .from("profiles")
    .select("is_admin_master")
    .eq("id", uid)
    .maybeSingle();
  if (prof?.is_admin_master) return;

  const { data: office } = await externalAdmin
    .from("offices")
    .select("status, trial_expires_at")
    .eq("owner_id", uid)
    .maybeSingle();
  const o = office as { status: string | null; trial_expires_at: string | null } | null;
  const active =
    o?.status === "active" ||
    (o?.status === "trial" && !!o.trial_expires_at && new Date(o.trial_expires_at).getTime() > Date.now());
  if (!active) throw new Error("Recurso exclusivo para assinantes Premium/Enterprise.");
}

export const getPremiumFileUrl = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ slug: z.enum(VALID_SLUGS), accessToken: z.string().min(10) }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertPremiumAccess(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: row, error } = await supabaseAdmin
      .from("premium_recurso_files")
      .select("filename, storage_path")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { url: null as string | null, filename: null as string | null };
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(row.storage_path, 3600, { download: row.filename });
    if (sErr) throw new Error(sErr.message);
    const { trackDownload } = await import("@/lib/download-track.server");
    await trackDownload({
      kind: "premium",
      slug: data.slug,
      filename: row.filename,
      accessLevel: "subscriber",
      accessToken: data.accessToken,
    });
    return { url: signed.signedUrl, filename: row.filename };
  });

export const createPremiumUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ slug: z.enum(VALID_SLUGS), filename: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const ext = data.filename.split(".").pop() ?? "bin";
    const path = `${data.slug}/${Date.now()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const registerPremiumFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.enum(VALID_SLUGS),
        filename: z.string().min(1).max(200),
        storage_path: z.string().min(1).max(400),
        size: z.number().int().nonnegative().optional(),
        content_type: z.string().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    // delete previous file (if any) to keep bucket clean
    const { data: prev } = await supabaseAdmin
      .from("premium_recurso_files")
      .select("storage_path")
      .eq("slug", data.slug)
      .maybeSingle();
    if (prev?.storage_path && prev.storage_path !== data.storage_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([prev.storage_path]);
    }
    const { error } = await supabaseAdmin.from("premium_recurso_files").upsert({
      slug: data.slug,
      filename: data.filename,
      storage_path: data.storage_path,
      size: data.size ?? null,
      content_type: data.content_type ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePremiumFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.enum(VALID_SLUGS) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: row } = await supabaseAdmin
      .from("premium_recurso_files")
      .select("storage_path")
      .eq("slug", data.slug)
      .maybeSingle();
    if (row?.storage_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([row.storage_path]);
    }
    const { error } = await supabaseAdmin
      .from("premium_recurso_files")
      .delete()
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
