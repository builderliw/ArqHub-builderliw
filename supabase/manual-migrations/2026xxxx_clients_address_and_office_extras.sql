-- =====================================================================
-- ArqHub — Campos de endereço em clients + tabelas auxiliares do escritório
--
-- COMO RODAR: Supabase Studio (banco externo) → SQL Editor. Idempotente.
-- =====================================================================

BEGIN;

-- 1. Endereço estruturado em clients (opcional)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cep         text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS rua         text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS numero      text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS bairro      text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cidade      text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS uf          text;

-- 2. Galeria de fotos do escritório
CREATE TABLE IF NOT EXISTS public.office_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  url         text NOT NULL,
  caption     text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS office_photos_office_idx ON public.office_photos(office_id);
ALTER TABLE public.office_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "office_photos_owner_all" ON public.office_photos;
CREATE POLICY "office_photos_owner_all" ON public.office_photos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_photos.office_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_photos.office_id AND o.owner_id = auth.uid()));

DROP POLICY IF EXISTS "office_photos_public_read" ON public.office_photos;
CREATE POLICY "office_photos_public_read" ON public.office_photos
  FOR SELECT TO anon, authenticated USING (true);

-- 3. Equipe do escritório
CREATE TABLE IF NOT EXISTS public.office_team (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  name        text NOT NULL,
  role        text,
  photo_url   text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS office_team_office_idx ON public.office_team(office_id);
ALTER TABLE public.office_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "office_team_owner_all" ON public.office_team;
CREATE POLICY "office_team_owner_all" ON public.office_team
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_team.office_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_team.office_id AND o.owner_id = auth.uid()));

DROP POLICY IF EXISTS "office_team_public_read" ON public.office_team;
CREATE POLICY "office_team_public_read" ON public.office_team
  FOR SELECT TO anon, authenticated USING (true);

COMMIT;
