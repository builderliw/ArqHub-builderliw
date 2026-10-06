// Server-only helpers for the ArqHub knowledge base.
// Embeddings via gateway de IA configurável (ver src/lib/ai-gateway.server.ts).
// ATENÇÃO: a tabela kb_chunks guarda vetores de 3072 dimensões. Use um modelo
// de embedding de 3072 dims (ex.: gemini-embedding-001) e reindexe a base.
import { embed, getAiApiKey } from "@/lib/ai-gateway.server";

export async function embedTexts(inputs: string[]): Promise<number[][]> {
  const key = getAiApiKey();
  if (!key) throw new Error("AI_API_KEY não configurada");
  const out: number[][] = [];
  // Gemini caps batch at 100 items.
  for (let i = 0; i < inputs.length; i += 50) {
    const batch = inputs.slice(i, i + 50);
    const res = await embed(batch, key);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Embedding falhou [${res.status}]: ${t}`);
    }
    const json = (await res.json()) as { data: Array<{ embedding: number[]; index: number }> };
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    for (const d of sorted) out.push(d.embedding);
  }
  return out;
}

export function chunkText(text: string, targetChars = 900, overlap = 120): string[] {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  if (clean.length <= targetChars) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(clean.length, i + targetChars);
    if (end < clean.length) {
      const nl = clean.lastIndexOf("\n", end);
      const dot = clean.lastIndexOf(". ", end);
      const cut = Math.max(nl, dot);
      if (cut > i + targetChars / 2) end = cut + 1;
    }
    chunks.push(clean.slice(i, end).trim());
    if (end >= clean.length) break;
    i = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}

export async function fetchPageAsText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ArqHubKB/1.0 (+https://arqhub.world)" },
  });
  if (!res.ok) throw new Error(`Falha ao buscar ${url}: HTTP ${res.status}`);
  const html = await res.text();
  return htmlToText(html);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
