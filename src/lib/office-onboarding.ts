// Utilitário de onboarding do escritório.
// Persiste todos os campos diretamente na tabela `offices` (colunas estendidas).
import { externalSupabase } from "@/integrations/external-supabase/client";

export type OfficeExtra = {
  razao_social?: string | null;
  cnpj?: string | null;
  cau?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  estado?: string | null;
  avatar_url?: string | null;
  team_size?: "1" | "2-5" | "6-10" | "11-20" | "20+" | null;
  specialties?: string[] | null;
  onboarding_completed?: boolean | null;
  onboarded_at?: string | null;
};

const EXTRA_COLUMNS =
  "razao_social, cnpj, cau, phone, whatsapp, email, instagram, cep, rua, numero, complemento, bairro, estado, avatar_url, team_size, specialties, onboarding_completed, onboarded_at";

export async function fetchOfficeExtra(officeId: string): Promise<OfficeExtra> {
  const { data, error } = await externalSupabase
    .from("offices")
    .select(EXTRA_COLUMNS)
    .eq("id", officeId)
    .maybeSingle();
  if (error || !data) return {};
  return data as OfficeExtra;
}

export async function saveOfficeExtra(
  officeId: string,
  data: OfficeExtra,
): Promise<{ error: string | null }> {
  const { error } = await externalSupabase
    .from("offices")
    .update(data as any)
    .eq("id", officeId);
  return { error: error?.message ?? null };
}

export const SPECIALTIES = [
  "Arquitetura Residencial",
  "Arquitetura Comercial",
  "Interiores",
  "Paisagismo",
  "Corporativo",
  "Urbanismo",
  "Compatibilização",
  "Engenharia",
];

export const TEAM_SIZES: { value: NonNullable<OfficeExtra["team_size"]>; label: string }[] = [
  { value: "1", label: "Apenas eu" },
  { value: "2-5", label: "2 a 5" },
  { value: "6-10", label: "6 a 10" },
  { value: "11-20", label: "11 a 20" },
  { value: "20+", label: "Mais de 20" },
];
