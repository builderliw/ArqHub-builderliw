-- Address fields for projects (rodar manualmente na Supabase externa)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS uf text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS complement text;
