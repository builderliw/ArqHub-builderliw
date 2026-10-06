-- =====================================================================
-- ArqHub — Painel do cliente: documentos c/ aprovação, fotos por álbum,
-- produtos detalhados.
-- COMO RODAR: SQL Editor do Supabase externo (yknwdpyaevodvonvhadt). Idempotente.
-- =====================================================================
BEGIN;

-- 1) project_documents: aprovação do cliente -------------------------------
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS approval_note text;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS doc_kind text; -- ex: orcamento, contrato, planta, outros

DO $$ BEGIN
  ALTER TABLE public.project_documents
    ADD CONSTRAINT project_documents_approval_status_chk
    CHECK (approval_status IN ('none','pending','approved','rejected','changes_requested'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) project_photos: galeria por álbum ------------------------------------
CREATE TABLE IF NOT EXISTS public.project_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  album         text NOT NULL DEFAULT 'obra',
  storage_path  text NOT NULL,
  caption       text,
  uploaded_by   uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_photos_project_idx ON public.project_photos(project_id);
CREATE INDEX IF NOT EXISTS project_photos_album_idx ON public.project_photos(project_id, album);

DO $$ BEGIN
  ALTER TABLE public.project_photos
    ADD CONSTRAINT project_photos_album_chk
    CHECK (album IN ('obra','consultoria','ajustes','outros'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_photos TO authenticated;
GRANT ALL ON public.project_photos TO service_role;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "office members manage photos" ON public.project_photos;
CREATE POLICY "office members manage photos" ON public.project_photos
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.office_users ou ON ou.office_id = p.office_id
    WHERE p.id = project_photos.project_id AND ou.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.office_users ou ON ou.office_id = p.office_id
    WHERE p.id = project_photos.project_id AND ou.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "client reads project photos" ON public.project_photos;
CREATE POLICY "client reads project photos" ON public.project_photos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.client_users cu ON cu.client_id = p.client_id
    WHERE p.id = project_photos.project_id AND cu.user_id = auth.uid()
  ));

-- 3) Bucket de fotos -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "project-photos read members" ON storage.objects;
CREATE POLICY "project-photos read members" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-photos');

DROP POLICY IF EXISTS "project-photos write members" ON storage.objects;
CREATE POLICY "project-photos write members" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-photos');

DROP POLICY IF EXISTS "project-photos delete members" ON storage.objects;
CREATE POLICY "project-photos delete members" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-photos');

-- 4) project_products: campos extras --------------------------------------
ALTER TABLE public.project_products ADD COLUMN IF NOT EXISTS ambiente text;
ALTER TABLE public.project_products ADD COLUMN IF NOT EXISTS purchase_mode text;  -- 'online' | 'presencial'
ALTER TABLE public.project_products ADD COLUMN IF NOT EXISTS vendor_name text;
ALTER TABLE public.project_products ADD COLUMN IF NOT EXISTS specifications text;

DO $$ BEGIN
  ALTER TABLE public.project_products
    ADD CONSTRAINT project_products_purchase_mode_chk
    CHECK (purchase_mode IS NULL OR purchase_mode IN ('online','presencial'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
