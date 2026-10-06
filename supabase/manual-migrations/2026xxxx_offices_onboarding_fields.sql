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
