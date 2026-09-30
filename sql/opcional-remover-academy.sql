-- =====================================================================
-- OPCIONAL — Remove as tabelas da ArqHub Academy do banco
-- yknwdpyaevodvonvhadt. Rode no SQL Editor SOMENTE depois que o novo
-- site estiver no ar sem a Academy. É irreversível (apaga os dados).
-- =====================================================================
BEGIN;
DROP TABLE IF EXISTS public.academy_topic_ai     CASCADE;
DROP TABLE IF EXISTS public.academy_progress     CASCADE;
DROP TABLE IF EXISTS public.academy_study_plans  CASCADE;
DROP TABLE IF EXISTS public.academy_track_topics CASCADE;
DROP TABLE IF EXISTS public.academy_tracks       CASCADE;
DROP TABLE IF EXISTS public.academy_topics       CASCADE;
COMMIT;
