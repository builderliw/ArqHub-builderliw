import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { externalAdmin } from "@/integrations/external-supabase/admin.server";

const BUCKET = "client-receipts";
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

async function ensureBucket() {
  try {
    const { data } = await externalAdmin.storage.getBucket(BUCKET);
    if (data) return;
  } catch {}
  try {
    await externalAdmin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_BYTES,
    });
  } catch {
    // ignore race
  }
}

async function validateCaller(token: string) {
  const { data, error } = await externalAdmin.auth.getUser(token);
  if (error || !data?.user) throw new Error("Unauthorized");
  return data.user.id as string;
}

export const listMyReceipts = createServerFn({ method: "POST" })
  .inputValidator((d: { externalAccessToken: string }) =>
    z.object({ externalAccessToken: z.string().min(10).max(4096) }).parse(d),
  )
  .handler(async ({ data }) => {
    const userId = await validateCaller(data.externalAccessToken);
    await ensureBucket();

    const { data: list, error } = await externalAdmin.storage
      .from(BUCKET)
      .list(userId, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) return { items: [] as any[] };

    const items = await Promise.all(
      (list ?? [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map(async (f) => {
          const path = `${userId}/${f.name}`;
          const { data: signed } = await externalAdmin.storage
            .from(BUCKET)
            .createSignedUrl(path, 60 * 60); // 1h
          return {
            name: f.name,
            path,
            size: (f.metadata as any)?.size ?? 0,
            mime: (f.metadata as any)?.mimetype ?? "application/octet-stream",
            created_at: f.created_at ?? new Date().toISOString(),
            url: signed?.signedUrl ?? null,
          };
        }),
    );
    return { items };
  });

export const uploadReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: {
    externalAccessToken: string;
    fileName: string;
    mime: string;
    base64: string;
  }) =>
    z
      .object({
        externalAccessToken: z.string().min(10).max(4096),
        fileName: z.string().min(1).max(255),
        mime: z.string().min(1).max(127),
        base64: z.string().min(1).max(Math.ceil(MAX_BYTES * 1.4)),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const userId = await validateCaller(data.externalAccessToken);
    await ensureBucket();

    const buffer = Buffer.from(data.base64, "base64");
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error("Arquivo maior que 15MB");
    }

    const safeName = data.fileName.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const stamp = Date.now();
    const path = `${userId}/${stamp}-${safeName}`;

    const { error } = await externalAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: data.mime, upsert: false });
    if (error) throw new Error(error.message);
    return { ok: true, path };
  });

export const deleteReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: { externalAccessToken: string; path: string }) =>
    z
      .object({
        externalAccessToken: z.string().min(10).max(4096),
        path: z.string().min(1).max(512),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const userId = await validateCaller(data.externalAccessToken);
    if (!data.path.startsWith(`${userId}/`)) throw new Error("Forbidden");
    const { error } = await externalAdmin.storage.from(BUCKET).remove([data.path]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
