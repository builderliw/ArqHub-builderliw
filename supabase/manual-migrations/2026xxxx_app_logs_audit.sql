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
