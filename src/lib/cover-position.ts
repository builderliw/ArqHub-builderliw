// Enquadramento vertical da capa do escritório.
// A posição é guardada no próprio cover_url como fragmento `#pos=NN`
// (0 = topo, 100 = base), mantendo compatibilidade com URLs antigas.

export function parseCover(url: string | null | undefined): { url: string; pos: number } {
  if (!url) return { url: "", pos: 50 };
  const m = url.match(/#pos=(\d{1,3})$/);
  if (!m) return { url, pos: 50 };
  const pos = Math.max(0, Math.min(100, Number(m[1])));
  return { url: url.slice(0, m.index), pos };
}

export function buildCover(url: string, pos: number): string {
  if (!url) return "";
  const clean = url.replace(/#pos=\d{1,3}$/, "");
  const p = Math.round(Math.max(0, Math.min(100, pos)));
  return p === 50 ? clean : `${clean}#pos=${p}`;
}

/** Props prontos para <img> respeitando o enquadramento salvo. */
export function coverImgProps(url: string | null | undefined) {
  const { url: src, pos } = parseCover(url);
  return { src, style: { objectPosition: `50% ${pos}%` } as const };
}
