// Server-only: resolve o título público de um material pelo slug.
import { seuNegocioMaterials } from "@/lib/materiais-seu-negocio";

export function seuNegonioTitle(slug: string): string | null {
  return seuNegocioMaterials.find((m) => m.id === slug)?.title ?? null;
}
