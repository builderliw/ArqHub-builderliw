-- ============================================================
-- FASE 5 — Mercado Pago + Trial/Assinaturas
-- Rode no SQL Editor do seu Supabase (yknwdpyaevodvonvhadt)
-- ============================================================

-- 1) Garante códigos nos planos (ajuste se já tiver outros)
insert into public.plans (code, name, price_cents, active)
values
  ('basico',  'Básico',  12999, true),
  ('premium', 'Premium', 24999, true)
on conflict (code) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  active = true;

-- 2) Garante constraint única por escritório em subscriptions
do $$ begin
  alter table public.subscriptions
    add constraint subscriptions_office_unique unique (office_id);
exception when duplicate_object then null;
end $$;

-- 3) Trial automático de 14 dias ao criar escritório
create or replace function public.set_office_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.trial_started_at is null then new.trial_started_at := now(); end if;
  if new.trial_expires_at is null then new.trial_expires_at := now() + interval '14 days'; end if;
  if new.status is null then new.status := 'trial'; end if;
  return new;
end $$;

drop trigger if exists trg_set_office_trial on public.offices;
create trigger trg_set_office_trial
before insert on public.offices
for each row execute function public.set_office_trial();

-- 4) Expirar trials vencidos (rode diariamente via pg_cron)
create or replace function public.expire_trials()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.offices
     set status = 'expired'
   where status = 'trial'
     and trial_expires_at < now();
end $$;

-- 5) pg_cron: executa todo dia às 03:00 UTC
create extension if not exists pg_cron;
select cron.schedule(
  'arqhub-expire-trials',
  '0 3 * * *',
  $$ select public.expire_trials(); $$
);

-- ============================================================
-- Configure no painel do Mercado Pago:
-- Webhook URL: https://arqhub.world/api/public/mp-webhook
-- Eventos: preapproval, subscription_preapproval, payment
-- ============================================================
