-- =====================================================================
-- ArqHub — Agenda (reuniões) e Anotações por etapa
-- COMO RODAR: SQL Editor do Supabase externo (yknwdpyaevodvonvhadt). Idempotente.
-- =====================================================================
BEGIN;

-- 1) Reuniões / agenda do cliente -----------------------------------------
CREATE TABLE IF NOT EXISTS public.project_meetings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id    uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  title        text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_min int NOT NULL DEFAULT 60,
  location     text,
  mode         text NOT NULL DEFAULT 'presencial',
  link         text,
  notes        text,
  status       text NOT NULL DEFAULT 'agendada',
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_meetings_project_idx ON public.project_meetings(project_id);
CREATE INDEX IF NOT EXISTS project_meetings_client_idx  ON public.project_meetings(client_id);
CREATE INDEX IF NOT EXISTS project_meetings_when_idx    ON public.project_meetings(scheduled_at);

DO $$ BEGIN
  ALTER TABLE public.project_meetings ADD CONSTRAINT project_meetings_mode_chk
    CHECK (mode IN ('presencial','online','telefone'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.project_meetings ADD CONSTRAINT project_meetings_status_chk
    CHECK (status IN ('agendada','realizada','cancelada','remarcada'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_meetings TO authenticated;
GRANT ALL ON public.project_meetings TO service_role;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "office members manage meetings" ON public.project_meetings;
CREATE POLICY "office members manage meetings" ON public.project_meetings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.office_users ou ON ou.office_id = p.office_id
                 WHERE p.id = project_meetings.project_id AND ou.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p JOIN public.office_users ou ON ou.office_id = p.office_id
                 WHERE p.id = project_meetings.project_id AND ou.user_id = auth.uid()));

DROP POLICY IF EXISTS "client reads meetings" ON public.project_meetings;
CREATE POLICY "client reads meetings" ON public.project_meetings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.client_users cu ON cu.client_id = p.client_id
                 WHERE p.id = project_meetings.project_id AND cu.user_id = auth.uid()));

-- 2) Anotações por etapa (registro de reuniões / decisões) ----------------
CREATE TABLE IF NOT EXISTS public.project_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id     uuid REFERENCES public.project_stages(id) ON DELETE SET NULL,
  meeting_id   uuid REFERENCES public.project_meetings(id) ON DELETE SET NULL,
  title        text,
  body         text NOT NULL,
  visible_to_client boolean NOT NULL DEFAULT false,
  noted_on     date NOT NULL DEFAULT now(),
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_notes_project_idx ON public.project_notes(project_id);
CREATE INDEX IF NOT EXISTS project_notes_stage_idx   ON public.project_notes(stage_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_notes TO authenticated;
GRANT ALL ON public.project_notes TO service_role;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "office members manage notes" ON public.project_notes;
CREATE POLICY "office members manage notes" ON public.project_notes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.office_users ou ON ou.office_id = p.office_id
                 WHERE p.id = project_notes.project_id AND ou.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p JOIN public.office_users ou ON ou.office_id = p.office_id
                 WHERE p.id = project_notes.project_id AND ou.user_id = auth.uid()));

DROP POLICY IF EXISTS "client reads visible notes" ON public.project_notes;
CREATE POLICY "client reads visible notes" ON public.project_notes
  FOR SELECT TO authenticated
  USING (visible_to_client = true AND EXISTS (
    SELECT 1 FROM public.projects p JOIN public.client_users cu ON cu.client_id = p.client_id
    WHERE p.id = project_notes.project_id AND cu.user_id = auth.uid()
  ));

COMMIT;
