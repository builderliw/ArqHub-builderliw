-- =====================================================================
-- ArqHub — Papéis customizados (Premium) e atribuição a membros
-- Rodar no banco EXTERNO (Supabase Studio → SQL Editor). Idempotente.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.office_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  name        text NOT NULL,
  modules     text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (office_id, name)
);

CREATE INDEX IF NOT EXISTS office_roles_office_idx ON public.office_roles(office_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_roles TO authenticated;

ALTER TABLE public.office_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "office_roles owner all" ON public.office_roles;
CREATE POLICY "office_roles owner all" ON public.office_roles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_id AND o.owner_id = auth.uid()));

DROP POLICY IF EXISTS "office_roles member read" ON public.office_roles;
CREATE POLICY "office_roles member read" ON public.office_roles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.office_members m
    WHERE m.office_id = office_roles.office_id AND m.user_id = auth.uid() AND m.status = 'active'
  ));

-- Vincular papel ao membro (nullable)
ALTER TABLE public.office_members
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.office_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS office_members_role_idx ON public.office_members(role_id);

DROP TRIGGER IF EXISTS office_roles_touch ON public.office_roles;
CREATE TRIGGER office_roles_touch
  BEFORE UPDATE ON public.office_roles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

COMMIT;
