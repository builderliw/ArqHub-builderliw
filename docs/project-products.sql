-- Aplique este SQL no Supabase EXTERNO do ArqHub (yknwdpyaevodvonvhadt).
-- Cria a tabela de produtos/referências de compra por projeto.

create table if not exists public.project_products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  category text,
  store_name text,
  store_url text,
  image_url text,
  price numeric(12,2),
  currency text not null default 'BRL',
  quantity integer not null default 1,
  visible_to_client boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_products_project_idx
  on public.project_products(project_id);

grant select, insert, update, delete on public.project_products to authenticated;
grant all on public.project_products to service_role;

alter table public.project_products enable row level security;

-- Membros do escritório dono do projeto podem gerenciar.
drop policy if exists "office members manage products" on public.project_products;
create policy "office members manage products" on public.project_products
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      join public.office_users ou on ou.office_id = p.office_id
      where p.id = project_products.project_id
        and ou.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      join public.office_users ou on ou.office_id = p.office_id
      where p.id = project_products.project_id
        and ou.user_id = auth.uid()
    )
  );

-- Cliente vinculado ao projeto pode ler produtos visíveis.
drop policy if exists "client reads visible products" on public.project_products;
create policy "client reads visible products" on public.project_products
  for select
  to authenticated
  using (
    visible_to_client = true
    and exists (
      select 1
      from public.projects p
      join public.client_users cu on cu.client_id = p.client_id
      where p.id = project_products.project_id
        and cu.user_id = auth.uid()
    )
  );
