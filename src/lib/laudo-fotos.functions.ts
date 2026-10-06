import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { externalAdmin } from "@/integrations/external-supabase/admin.server";

const BUCKET = "laudo-fotos";
const MAX_BYTES = 8 * 1024 * 1024;

async function ensureBucket() {
  try {
    const { data } = await externalAdmin.storage.getBucket(BUCKET);
    if (data) return;
  } catch {}
  try {
    await externalAdmin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_BYTES });
  } catch {
    // ignore race
  }
}

async function validateCaller(token: string) {
  const { data, error } = await externalAdmin.auth.getUser(token);
  if (error || !data?.user) throw new Error("Sessão expirada. Faça login novamente.");
  return data.user.id as string;
}

export const createLaudoFotoUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        externalAccessToken: z.string().min(10).max(4096),
        filename: z.string().min(1).max(200),
        contentType: z.string().min(3).max(120),
        size: z.number().int().positive().max(MAX_BYTES),
        laudoNumero: z.string().max(120).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const userId = await validateCaller(data.externalAccessToken);
    if (!data.contentType.startsWith("image/")) throw new Error("Envie apenas imagens.");
    await ensureBucket();

    const safe = data.filename.replace(/[^\w.\-]+/g, "_").slice(-120);
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;

    const { data: signed, error } = await externalAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Falha ao preparar o envio");

    await externalAdmin.from("laudo_fotos").insert({
      user_id: userId,
      laudo_numero: data.laudoNumero || null,
      storage_path: path,
      filename: data.filename,
      size: data.size,
      content_type: data.contentType,
    });

    return { path, token: signed.token, url: signed.signedUrl };
  });

export const deleteLaudoFoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        externalAccessToken: z.string().min(10).max(4096),
        path: z.string().min(3).max(400),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const userId = await validateCaller(data.externalAccessToken);
    if (!data.path.startsWith(`${userId}/`)) throw new Error("Acesso negado");
    await externalAdmin.storage.from(BUCKET).remove([data.path]);
    await externalAdmin.from("laudo_fotos").delete().eq("storage_path", data.path);
    return { ok: true };
  });
