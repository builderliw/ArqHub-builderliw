-- =====================================================================
-- ArqHub — Membros do Escritório (Etapa 1)
-- Cria tabelas para convidar membros (arquitetos/colaboradores) ao
-- escritório, com vínculo opcional a usuários auth.users e
-- atribuição por projeto.
--
-- COMO RODAR: execute no banco EXTERNO (Supabase Studio → SQL Editor).
-- É idempotente.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) office_members
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.office_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email       text NOT NULL,
  full_name   text NOT NULL,
  avatar_url  text,
  status      text NOT NULL DEFAULT 'invited'
              CHECK (status IN ('invited','active','disabled')),
  invited_at  timestamptz NOT NULL DEFAULT now(),
  joined_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (office_id, email)
);

CREATE INDEX IF NOT EXISTS office_members_office_idx ON public.office_members(office_id);
CREATE INDEX IF NOT EXISTS office_members_user_idx   ON public.office_members(user_id);
CREATE INDEX IF NOT EXISTS office_members_email_idx  ON public.office_members(lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_members TO authenticated;

ALTER TABLE public.office_members ENABLE ROW LEVEL SECURITY;

-- Dono do escritório gerencia tudo
DROP POLICY IF EXISTS "office_members owner all" ON public.office_members;
CREATE POLICY "office_members owner all" ON public.office_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_id AND o.owner_id = auth.uid()));

-- Membro vê o próprio registro (por user_id OU pelo email do JWT)
DROP POLICY IF EXISTS "office_members self read" ON public.office_members;
CREATE POLICY "office_members self read" ON public.office_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
  );

-- Membro pode atualizar seu próprio user_id ao logar pela primeira vez
DROP POLICY IF EXISTS "office_members self link" ON public.office_members;
CREATE POLICY "office_members self link" ON public.office_members
  FOR UPDATE TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email')::text, '')))
  WITH CHECK (lower(email) = lower(coalesce((auth.jwt() ->> 'email')::text, '')));

-- ---------------------------------------------------------------------
-- 2) project_members
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES public.office_members(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, member_id)
);

CREATE INDEX IF NOT EXISTS project_members_project_idx ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS project_members_member_idx  ON public.project_members(member_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_members owner all" ON public.project_members;
CREATE POLICY "project_members owner all" ON public.project_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.offices o ON o.id = p.office_id
    WHERE p.id = project_id AND o.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.offices o ON o.id = p.office_id
    WHERE p.id = project_id AND o.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "project_members member read" ON public.project_members;
CREATE POLICY "project_members member read" ON public.project_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.office_members m
    WHERE m.id = member_id AND m.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- 3) Acesso a projetos para membros (estende RLS existente)
-- ---------------------------------------------------------------------
-- Membro vê projetos onde foi atribuído.
DROP POLICY IF EXISTS "projects member read" ON public.projects;
CREATE POLICY "projects member read" ON public.projects
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.project_members pm
    JOIN public.office_members om ON om.id = pm.member_id
    WHERE pm.project_id = projects.id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
  ));

-- ---------------------------------------------------------------------
-- 4) updated_at trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS office_members_touch ON public.office_members;
CREATE TRIGGER office_members_touch
  BEFORE UPDATE ON public.office_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

COMMIT;
