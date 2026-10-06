-- =====================================================================
-- ArqHub — Histórico de atividades por projeto (auditoria da equipe)
-- Rodar no banco EXTERNO (Supabase Studio → SQL Editor). Idempotente.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_activity (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  office_id    uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  actor_id     uuid,
  actor_name   text,
  actor_role   text,
  action       text NOT NULL,
  detail       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_activity_project_idx ON public.project_activity(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS project_activity_office_idx  ON public.project_activity(office_id, created_at DESC);

GRANT SELECT ON public.project_activity TO authenticated;

ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;

-- Somente leitura pelo dono do escritório ou membro ativo. Escrita só via service role.
DROP POLICY IF EXISTS "project_activity office read" ON public.project_activity;
CREATE POLICY "project_activity office read" ON public.project_activity
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.offices o WHERE o.id = office_id AND o.owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.office_members m
      WHERE m.office_id = project_activity.office_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

COMMIT;
