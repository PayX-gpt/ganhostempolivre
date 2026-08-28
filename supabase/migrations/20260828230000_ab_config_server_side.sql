-- Config A/B server-side: fonte única de verdade lida pelo funil (todos os
-- visitantes) e escrita pelo painel /live. Substitui o antigo controle por
-- localStorage (que só valia no navegador do admin).
create table if not exists public.ab_config (
  id int primary key default 1,
  variant_active_variants text[] not null default array['A','E'],
  variant_winner text,
  version_v2_split int not null default 50,
  version_test_active boolean not null default true,
  version_winner text,
  updated_at timestamptz not null default now(),
  constraint ab_config_singleton check (id = 1)
);

insert into public.ab_config (id) values (1) on conflict (id) do nothing;

alter table public.ab_config enable row level security;

drop policy if exists "ab_config_read" on public.ab_config;
create policy "ab_config_read" on public.ab_config for select using (true);

drop policy if exists "ab_config_update" on public.ab_config;
create policy "ab_config_update" on public.ab_config for update using (true) with check (true);
