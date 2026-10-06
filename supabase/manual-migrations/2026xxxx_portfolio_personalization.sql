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
