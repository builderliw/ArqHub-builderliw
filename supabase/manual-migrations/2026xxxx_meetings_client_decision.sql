-- =====================================================================
-- ArqHub — Decisão do cliente sobre reuniões agendadas
-- COMO RODAR: SQL Editor do Supabase externo (yknwdpyaevodvonvhadt). Idempotente.
-- =====================================================================
BEGIN;

-- Colunas de decisão do cliente
ALTER TABLE public.project_meetings
  ADD COLUMN IF NOT EXISTS client_status      text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS client_note        text,
  ADD COLUMN IF NOT EXISTS client_decided_at  timestamptz,
  ADD COLUMN IF NOT EXISTS client_decided_by  uuid;

DO $$ BEGIN
  ALTER TABLE public.project_meetings ADD CONSTRAINT project_meetings_client_status_chk
    CHECK (client_status IN ('pending','accepted','declined'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS project_meetings_client_status_idx
  ON public.project_meetings(client_status);

-- Permite cliente atualizar APENAS a própria decisão (status/note/decided_at/by)
DROP POLICY IF EXISTS "client updates own meeting decision" ON public.project_meetings;
CREATE POLICY "client updates own meeting decision" ON public.project_meetings
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.client_users cu ON cu.client_id = p.client_id
    WHERE p.id = project_meetings.project_id AND cu.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.client_users cu ON cu.client_id = p.client_id
    WHERE p.id = project_meetings.project_id AND cu.user_id = auth.uid()
  ));

COMMIT;
