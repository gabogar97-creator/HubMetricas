alter table if exists public.ops_sprints
  add column if not exists velocity numeric,
  add column if not exists deadlines_agreed integer,
  add column if not exists deadlines_met integer;

create index if not exists ops_sprints_user_id_created_at_idx on public.ops_sprints(user_id, created_at);
