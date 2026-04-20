create table if not exists public.ops_sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  sprint_id bigint,
  sprint text,
  date date,
  sp_estimate numeric,
  sp_done numeric,
  throughput numeric,
  bugs_volume numeric,
  deadline_accuracy numeric,
  not_estimated_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ops_sprints_user_id_idx on public.ops_sprints(user_id);
create index if not exists ops_sprints_user_id_date_idx on public.ops_sprints(user_id, date);

alter table public.ops_sprints enable row level security;

create policy "ops_sprints_select_own" on public.ops_sprints
for select
to authenticated
using (auth.uid() = user_id);

create policy "ops_sprints_insert_own" on public.ops_sprints
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "ops_sprints_update_own" on public.ops_sprints
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "ops_sprints_delete_own" on public.ops_sprints
for delete
to authenticated
using (auth.uid() = user_id);
