import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "materiais";

async function assertAdminByToken(accessToken: string) {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data: userData, error: userErr } = await externalAdmin.auth.getUser(accessToken);
  if (userErr || !userData?.user?.id) throw new Error("Não autenticado");
  const { data: prof } = await externalAdmin
    .from("profiles")
    .select("is_admin_master")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!prof?.is_admin_master) throw new Error("Acesso restrito a administradores");
}

const CategorySchema = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/);
const SlugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);
const TokenSchema = z.string().min(10);

export const listMaterialFiles = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ category: CategorySchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: rows, error } = await supabaseAdmin
      .from("material_files")
      .select("category, slug, filename, storage_path, size, content_type, access_level, updated_at")
      .eq("category", data.category);
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

async function userHasActiveSubscription(accessToken: string): Promise<boolean> {
  const { externalAdmin } = await import("@/integrations/external-supabase/admin.server");
  const { data: userData } = await externalAdmin.auth.getUser(accessToken);
  const uid = userData?.user?.id;
  if (!uid) return false;
  const { data: office } = await externalAdmin
    .from("offices")
    .select("id, status, trial_expires_at")
    .eq("owner_id", uid)
    .maybeSingle();
  if (!office) return false;
  const o = office as { id: string; status: string | null; trial_expires_at: string | null };
  if (o.status === "active") return true;
  if (o.status === "trial" && o.trial_expires_at && new Date(o.trial_expires_at).getTime() > Date.now()) return true;
  return false;
}

export const getMaterialFileUrl = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    category: CategorySchema,
    slug: SlugSchema,
    accessToken: z.string().min(10).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: row, error } = await supabaseAdmin
      .from("material_files")
      .select("filename, storage_path, access_level")
      .eq("category", data.category)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { url: null as string | null, filename: null as string | null, restricted: false };
    if ((row as { access_level?: string }).access_level === "subscriber") {
      if (!data.accessToken || !(await userHasActiveSubscription(data.accessToken))) {
        return { url: null, filename: null, restricted: true };
      }
    }
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(row.storage_path, 3600, { download: row.filename });
    if (sErr) throw new Error(sErr.message);
    const { trackDownload } = await import("@/lib/download-track.server");
    await trackDownload({
      kind: "material",
      category: data.category,
      slug: data.slug,
      filename: row.filename,
      accessLevel: (row as { access_level?: string }).access_level ?? null,
      accessToken: data.accessToken ?? null,
    });
    return { url: signed.signedUrl, filename: row.filename, restricted: false };
  });



export const createMaterialUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      accessToken: TokenSchema,
      category: CategorySchema,
      slug: SlugSchema,
      filename: z.string().min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const ext = data.filename.split(".").pop() ?? "bin";
    const path = `${data.category}/${data.slug}/${Date.now()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const registerMaterialFile = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      accessToken: TokenSchema,
      category: CategorySchema,
      slug: SlugSchema,
      filename: z.string().min(1).max(200),
      storage_path: z.string().min(1).max(400),
      size: z.number().int().nonnegative().optional(),
      content_type: z.string().max(120).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: prev } = await supabaseAdmin
      .from("material_files")
      .select("storage_path")
      .eq("category", data.category)
      .eq("slug", data.slug)
      .maybeSingle();
    if (prev?.storage_path && prev.storage_path !== data.storage_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([prev.storage_path]);
    }
    const { error } = await supabaseAdmin.from("material_files").upsert({
      category: data.category,
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

export const deleteMaterialFile = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ accessToken: TokenSchema, category: CategorySchema, slug: SlugSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: row } = await supabaseAdmin
      .from("material_files")
      .select("storage_path")
      .eq("category", data.category)
      .eq("slug", data.slug)
      .maybeSingle();
    if (row?.storage_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([row.storage_path]);
    }
    const { error } = await supabaseAdmin
      .from("material_files")
      .delete()
      .eq("category", data.category)
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setMaterialAccessLevel = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      accessToken: TokenSchema,
      category: CategorySchema,
      slug: SlugSchema,
      access_level: z.enum(["free", "subscriber"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertAdminByToken(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { error } = await supabaseAdmin
      .from("material_files")
      .update({ access_level: data.access_level, updated_at: new Date().toISOString() })
      .eq("category", data.category)
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
