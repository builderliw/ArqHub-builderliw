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
