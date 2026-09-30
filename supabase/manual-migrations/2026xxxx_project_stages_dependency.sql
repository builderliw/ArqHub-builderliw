-- =====================================================================
-- ArqHub — Adiciona dependência entre etapas de projeto (project_stages)
-- COMO RODAR: SQL Editor do Supabase externo (yknwdpyaevodvonvhadt). Idempotente.
-- =====================================================================
BEGIN;

ALTER TABLE public.project_stages
  ADD COLUMN IF NOT EXISTS depends_on uuid
  REFERENCES public.project_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_stages_depends_on_idx
  ON public.project_stages(depends_on);

COMMIT;
