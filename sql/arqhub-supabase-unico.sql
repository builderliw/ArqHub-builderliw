-- ############ ArqHub — BANCO ÚNICO (projeto yknwdpyaevodvonvhadt) ############
-- (versão limpa: sem ArqHub Academy)
-- =====================================================================
-- ArqHub — Painel de Logs & Auditoria
-- Tabela única para erros e eventos de auditoria do app, com filtros por
-- tela, usuário, rota, nível e data.
--
-- RODAR no Supabase EXTERNO (SQL Editor). Idempotente.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  level         text NOT NULL DEFAULT 'info'
                CHECK (level IN ('debug','info','warn','error','audit')),
  source        text NOT NULL DEFAULT 'client'   -- client | server | webhook
                CHECK (source IN ('client','server','webhook','db')),
  screen        text,                            -- nome da tela (ex: "clientes")
  route         text,                            -- pathname (ex: "/app/profissional/clientes")
  action        text,                            -- ex: "clients.insert", "auth.signIn"
  message       text NOT NULL,
  details       jsonb,                           -- payload livre (stack, params, response)
  user_id       uuid,                            -- auth.uid() do autor (nullable p/ anônimos)
  user_email    text,
  office_id     uuid,
  user_agent    text,
  ip            text
);

CREATE INDEX IF NOT EXISTS app_logs_created_at_idx ON public.app_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS app_logs_user_id_idx    ON public.app_logs (user_id);
CREATE INDEX IF NOT EXISTS app_logs_level_idx      ON public.app_logs (level);
CREATE INDEX IF NOT EXISTS app_logs_screen_idx     ON public.app_logs (screen);
CREATE INDEX IF NOT EXISTS app_logs_office_idx     ON public.app_logs (office_id);

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: qualquer usuário autenticado pode gravar seu próprio log
-- (user_id deve bater com auth.uid() ou ser NULL para eventos anônimos)
DROP POLICY IF EXISTS "app_logs_insert_self" ON public.app_logs;
CREATE POLICY "app_logs_insert_self" ON public.app_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "app_logs_insert_anon" ON public.app_logs;
CREATE POLICY "app_logs_insert_anon" ON public.app_logs
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- SELECT: o próprio usuário vê seus logs; admin vê tudo
-- (a checagem de admin é feita por uma função que olha auth.users.raw_app_meta_data
--  ou por email em uma lista – aqui usamos email do JWT contra constante "admin")
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN (
      SELECT lower(trim(unnest(string_to_array(
        COALESCE(current_setting('app.admin_emails', true), ''), ','
      ))))
    ),
    false
  )
$$;

DROP POLICY IF EXISTS "app_logs_select_self_or_admin" ON public.app_logs;
CREATE POLICY "app_logs_select_self_or_admin" ON public.app_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

COMMIT;
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
-- =====================================================================
-- ArqHub — Registro de downloads (materiais e recursos premium)
-- Já aplicado no banco do ArqHub (Lovable Cloud). Guardado aqui para
-- referência / caso precise recriar. Idempotente.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.download_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL DEFAULT 'material',   -- material | premium
  category      text,
  slug          text NOT NULL,
  filename      text,
  title         text,
  access_level  text,                               -- free | subscriber
  user_email    text,
  user_id       uuid,
  device        text,
  path          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS download_events_created_at_idx ON public.download_events (created_at DESC);
CREATE INDEX IF NOT EXISTS download_events_slug_idx       ON public.download_events (kind, slug);

GRANT ALL ON public.download_events TO service_role;

ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
-- Sem policies: leitura/escrita apenas pelo servidor (service_role).
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
-- Adiciona "cargo" ao membro do escritório. Rodar no Supabase externo.
ALTER TABLE public.office_members
  ADD COLUMN IF NOT EXISTS position text;
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
-- =====================================================================
-- ArqHub — Onboarding do Escritório
-- Adiciona colunas estendidas em public.offices para persistir os dados
-- do wizard de primeiro login (antes ficavam apenas em localStorage).
--
-- COMO RODAR: este SQL deve ser executado no banco EXTERNO onde a tabela
-- `offices` existe (Supabase Studio → SQL Editor). É idempotente.
-- =====================================================================

BEGIN;

-- 1. Identidade jurídica / profissional
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS razao_social text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS cnpj         text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS cau          text;

-- 2. Contato
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS phone        text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS whatsapp     text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS email        text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS instagram    text;

-- 3. Endereço
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS cep          text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS rua          text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS numero       text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS complemento  text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS bairro       text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS estado       text;

-- 4. Identidade visual / perfil
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS avatar_url   text;
-- logo_url e cover_url já existem; mantidos.

-- 5. Configurações do escritório
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS team_size    text
  CHECK (team_size IS NULL OR team_size IN ('1','2-5','6-10','11-20','20+'));
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS specialties  text[] DEFAULT '{}'::text[];

-- 6. Flags de onboarding
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS onboarded_at         timestamptz;

-- 7. Índices úteis para busca/filtragem
CREATE INDEX IF NOT EXISTS offices_onboarding_completed_idx
  ON public.offices (onboarding_completed);
CREATE INDEX IF NOT EXISTS offices_specialties_gin_idx
  ON public.offices USING gin (specialties);

COMMIT;
-- =====================================================================
-- ArqHub — Personalização do Portfólio do Escritório
-- Adiciona colunas usadas pela página de edição e pela página pública
-- /escritorio/$slug: história do escritório, biografia dos arquitetos
-- (membros) e filtro por especialidade nos projetos publicados.
--
-- COMO RODAR: execute no banco EXTERNO (Supabase Studio → SQL Editor).
-- É idempotente.
-- =====================================================================

BEGIN;

-- offices: história + ano de fundação
ALTER TABLE public.offices
  ADD COLUMN IF NOT EXISTS history       text,
  ADD COLUMN IF NOT EXISTS founded_year  int;

-- office_members: bio + especialidade individual
ALTER TABLE public.office_members
  ADD COLUMN IF NOT EXISTS bio         text,
  ADD COLUMN IF NOT EXISTS specialty   text,
  ADD COLUMN IF NOT EXISTS position    text; -- caso ainda não exista

-- projects: especialidade (categoria) para filtro do portfólio
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS specialty   text,
  ADD COLUMN IF NOT EXISTS year        int;

-- Torna a foto pública do membro legível anonimamente quando o
-- escritório está com portfolio_public = true (para o público ler os
-- arquitetos na página do cartão).
DROP POLICY IF EXISTS "office_members public read" ON public.office_members;
CREATE POLICY "office_members public read" ON public.office_members
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offices o
    WHERE o.id = office_id AND o.portfolio_public = true
  ));

-- E o vínculo membro↔projeto também precisa ser público quando ambos
-- office.portfolio_public e project.portfolio_visible forem true.
DROP POLICY IF EXISTS "project_members public read" ON public.project_members;
CREATE POLICY "project_members public read" ON public.project_members
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.offices o ON o.id = p.office_id
    WHERE p.id = project_id
      AND o.portfolio_public = true
      AND p.portfolio_visible = true
  ));

GRANT SELECT ON public.office_members  TO anon;
GRANT SELECT ON public.project_members TO anon;

COMMIT;
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
-- Address fields for projects (rodar manualmente na Supabase externa)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS uf text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS complement text;

-- =====================================================================
-- ArqHub — PARTE 2: tabelas que estavam no banco secundário (Lovable Cloud)
-- Rodar no Supabase yknwdpyaevodvonvhadt (SQL Editor). Idempotente.
-- =====================================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ------------------------------------------------------------ Leitura artigos
CREATE TABLE IF NOT EXISTS public.article_reads (
  slug        text PRIMARY KEY,
  count       bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.article_reads TO anon, authenticated;
GRANT ALL ON public.article_reads TO service_role;
ALTER TABLE public.article_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "article_reads read" ON public.article_reads;
CREATE POLICY "article_reads read" ON public.article_reads FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.increment_article_read(_slug text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count bigint;
BEGIN
  IF _slug IS NULL OR length(trim(_slug)) = 0 OR length(_slug) > 300 THEN
    RAISE EXCEPTION 'invalid slug';
  END IF;
  INSERT INTO public.article_reads (slug, count, updated_at) VALUES (_slug, 1, now())
  ON CONFLICT (slug) DO UPDATE
    SET count = public.article_reads.count + 1, updated_at = now()
  RETURNING count INTO v_count;
  RETURN v_count;
END; $$;
REVOKE ALL ON FUNCTION public.increment_article_read(text) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_article_read(text) TO anon, authenticated, service_role;

-- ------------------------------------------------- Base de conhecimento (Liw)
CREATE TABLE IF NOT EXISTS public.kb_sources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  source_type  text NOT NULL DEFAULT 'text',
  url          text,
  category     text,
  chunk_count  integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.kb_chunks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    uuid NOT NULL REFERENCES public.kb_sources(id) ON DELETE CASCADE,
  chunk_index  integer NOT NULL DEFAULT 0,
  content      text NOT NULL,
  embedding    vector(3072) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kb_chunks_source_idx ON public.kb_chunks(source_id);
GRANT ALL ON public.kb_sources TO service_role;
GRANT ALL ON public.kb_chunks TO service_role;
ALTER TABLE public.kb_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kb_sources service only" ON public.kb_sources;
CREATE POLICY "kb_sources service only" ON public.kb_sources FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "kb_chunks service only" ON public.kb_chunks;
CREATE POLICY "kb_chunks service only" ON public.kb_chunks FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.match_kb_chunks(query_embedding vector, match_count integer DEFAULT 5)
RETURNS TABLE(id uuid, source_id uuid, content text, title text, url text, similarity double precision)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT c.id, c.source_id, c.content, s.title, s.url,
         1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) AS similarity
  FROM public.kb_chunks c
  JOIN public.kb_sources s ON s.id = c.source_id
  ORDER BY c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  LIMIT match_count;
$$;
REVOKE ALL ON FUNCTION public.match_kb_chunks(vector, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.match_kb_chunks(vector, integer) TO service_role;

-- ----------------------------------------------- Materiais e recursos premium
CREATE TABLE IF NOT EXISTS public.material_files (
  category      text NOT NULL,
  slug          text NOT NULL,
  filename      text NOT NULL,
  storage_path  text NOT NULL,
  size          bigint,
  content_type  text,
  access_level  text NOT NULL DEFAULT 'free',
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (category, slug)
);
CREATE TABLE IF NOT EXISTS public.premium_recurso_files (
  slug          text PRIMARY KEY,
  filename      text NOT NULL,
  storage_path  text NOT NULL,
  size          bigint,
  content_type  text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.material_purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    text,
  category      text NOT NULL,
  slug          text NOT NULL,
  buyer_email   text NOT NULL,
  buyer_name    text,
  amount        numeric NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending',
  delivered_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS material_purchases_email_idx ON public.material_purchases(buyer_email);
GRANT ALL ON public.material_files TO service_role;
GRANT ALL ON public.premium_recurso_files TO service_role;
GRANT ALL ON public.material_purchases TO service_role;
ALTER TABLE public.material_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_recurso_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "material_files service only" ON public.material_files;
CREATE POLICY "material_files service only" ON public.material_files FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "premium_recurso_files service only" ON public.premium_recurso_files;
CREATE POLICY "premium_recurso_files service only" ON public.premium_recurso_files FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "material_purchases service only" ON public.material_purchases;
CREATE POLICY "material_purchases service only" ON public.material_purchases FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------- Downloads / telemetria
CREATE TABLE IF NOT EXISTS public.download_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL,
  category      text,
  slug          text NOT NULL,
  filename      text,
  title         text,
  access_level  text,
  user_email    text,
  user_id       uuid,
  device        text,
  path          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS download_events_created_idx ON public.download_events(created_at DESC);
GRANT ALL ON public.download_events TO service_role;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "download_events service only" ON public.download_events;
CREATE POLICY "download_events service only" ON public.download_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------ Configurações da plataforma
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                boolean PRIMARY KEY DEFAULT true,
  platform_name     text NOT NULL DEFAULT 'ArqHub',
  support_email     text NOT NULL DEFAULT 'contato@arqhub.world',
  enable_signups    boolean NOT NULL DEFAULT true,
  enable_payments   boolean NOT NULL DEFAULT true,
  maintenance_mode  boolean NOT NULL DEFAULT false,
  announcement      text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id)
);
INSERT INTO public.platform_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_settings service only" ON public.platform_settings;
CREATE POLICY "platform_settings service only" ON public.platform_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------- Suporte e leads enterprise
CREATE TABLE IF NOT EXISTS public.support_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'new',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.enterprise_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa        text NOT NULL,
  cnpj           text,
  nome           text NOT NULL,
  email          text NOT NULL,
  telefone       text NOT NULL,
  cargo          text,
  num_escritorios text,
  num_usuarios   text,
  mensagem       text NOT NULL,
  status         text NOT NULL DEFAULT 'new',
  created_at     timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.support_messages TO service_role;
GRANT ALL ON public.enterprise_requests TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_messages service only" ON public.support_messages;
CREATE POLICY "support_messages service only" ON public.support_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "enterprise_requests service only" ON public.enterprise_requests;
CREATE POLICY "enterprise_requests service only" ON public.enterprise_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at BEFORE UPDATE ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------- Pagamentos (histórico)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  payment_id         text,
  preapproval_id     text,
  office_id          uuid,
  external_reference text,
  event_type         text NOT NULL,
  status             text,
  status_detail      text,
  method             text,
  amount             numeric,
  plan_code          text,
  frequency          text,
  payer_email        text,
  payer_cpf          text,
  raw                jsonb
);
CREATE INDEX IF NOT EXISTS payment_events_office_idx ON public.payment_events(office_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_events_email_idx ON public.payment_events(payer_email);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_events service only" ON public.payment_events;
CREATE POLICY "payment_events service only" ON public.payment_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------- Notificações push e preferências
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    text NOT NULL,
  endpoint      text NOT NULL UNIQUE,
  p256dh        text NOT NULL,
  auth          text NOT NULL,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    text NOT NULL UNIQUE,
  new_document  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.plan_notification_settings (
  plan_code     text PRIMARY KEY,
  new_document  boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_subscriptions TO service_role;
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.plan_notification_settings TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions service only" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions service only" ON public.push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "notification_preferences service only" ON public.notification_preferences;
CREATE POLICY "notification_preferences service only" ON public.notification_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "plan_notification_settings service only" ON public.plan_notification_settings;
CREATE POLICY "plan_notification_settings service only" ON public.plan_notification_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------- E-mails (registro)
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     text,
  template_name  text NOT NULL,
  recipient_email text NOT NULL,
  status         text NOT NULL DEFAULT 'sent',
  error_message  text,
  metadata       jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  reason      text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text NOT NULL UNIQUE,
  email       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  used_at     timestamptz
);
GRANT ALL ON public.email_send_log TO service_role;
GRANT ALL ON public.suppressed_emails TO service_role;
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_send_log service only" ON public.email_send_log;
CREATE POLICY "email_send_log service only" ON public.email_send_log FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "suppressed_emails service only" ON public.suppressed_emails;
CREATE POLICY "suppressed_emails service only" ON public.suppressed_emails FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "email_unsubscribe_tokens service only" ON public.email_unsubscribe_tokens;
CREATE POLICY "email_unsubscribe_tokens service only" ON public.email_unsubscribe_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

-- --------------------------------------------------------------- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais','materiais',false), ('recursos-premium','recursos-premium',false), ('office-assets','office-assets',false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
