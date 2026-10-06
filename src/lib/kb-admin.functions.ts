import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenInput = z.object({ accessToken: z.string().min(10) });

const AddSchema = TokenInput.extend({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().max(80).optional().nullable(),
  source_type: z.enum(["text", "url"]),
  content: z.string().trim().min(1).max(200000).optional(),
  url: z.string().trim().url().optional(),
});

async function requireAdmin(accessToken: string) {
  const { assertAdminByToken } = await import("@/lib/admin-auth.server");
  await assertAdminByToken(accessToken);
}

export const listKbSources = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { data: rows, error } = await supabaseAdmin
      .from("kb_sources" as never)
      .select("id, title, source_type, url, category, chunk_count, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      id: string;
      title: string;
      source_type: "text" | "url" | "file";
      url: string | null;
      category: string | null;
      chunk_count: number;
      created_at: string;
    }>;
  });

export const addKbSource = createServerFn({ method: "POST" })
  .inputValidator((d) => AddSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { embedTexts, chunkText, fetchPageAsText } = await import("@/lib/kb.server");

    let text = "";
    if (data.source_type === "url") {
      if (!data.url) throw new Error("URL obrigatória");
      text = await fetchPageAsText(data.url);
    } else {
      if (!data.content) throw new Error("Conteúdo obrigatório");
      text = data.content;
    }
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error("Nenhum conteúdo aproveitável foi extraído");

    const embeddings = await embedTexts(chunks);

    const { data: src, error: srcErr } = await (supabaseAdmin.from("kb_sources" as never) as unknown as {
      insert: (v: unknown) => { select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
    })
      .insert({
        title: data.title,
        source_type: data.source_type,
        url: data.url ?? null,
        category: data.category ?? null,
        chunk_count: chunks.length,
      })
      .select("id")
      .single();
    if (srcErr || !src) throw new Error(srcErr?.message ?? "Falha ao criar fonte");
    const sourceId = src.id;

    const rows = chunks.map((content, i) => ({
      source_id: sourceId,
      chunk_index: i,
      content,
      embedding: embeddings[i] as unknown as string,
    }));
    const chunksTable = supabaseAdmin.from("kb_chunks" as never) as unknown as {
      insert: (v: unknown) => Promise<{ error: { message: string } | null }>;
    };
    for (let i = 0; i < rows.length; i += 50) {
      const slice = rows.slice(i, i + 50);
      const { error } = await chunksTable.insert(slice);
      if (error) {
        await supabaseAdmin.from("kb_sources" as never).delete().eq("id", sourceId);
        throw new Error(error.message);
      }
    }
    return { id: sourceId, chunk_count: chunks.length };
  });

export const deleteKbSource = createServerFn({ method: "POST" })
  .inputValidator((d) => TokenInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/external-supabase/admin.server");
    const { error } = await supabaseAdmin.from("kb_sources" as never).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
