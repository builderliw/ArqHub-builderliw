-- Adiciona "cargo" ao membro do escritório. Rodar no Supabase externo.
ALTER TABLE public.office_members
  ADD COLUMN IF NOT EXISTS position text;
