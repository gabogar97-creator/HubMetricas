
 create table if not exists public.okrs (
   id bigserial primary key,
   project_id bigint not null references public.projects(id) on delete cascade,
   base_year integer not null,
   objective_name text not null,
   created_at timestamptz not null default now()
 );

 create index if not exists okrs_project_id_idx on public.okrs(project_id);
 create index if not exists okrs_project_id_base_year_idx on public.okrs(project_id, base_year);

 create table if not exists public.okr_key_results (
   id bigserial primary key,
   okr_id bigint not null references public.okrs(id) on delete cascade,
   name text not null,
   calc_memory text,
   source text,
   global_target numeric,
   created_at timestamptz not null default now()
 );

 create index if not exists okr_key_results_okr_id_idx on public.okr_key_results(okr_id);

 create table if not exists public.collection_okr_key_results (
   id bigserial primary key,
   okr_key_result_id bigint not null references public.okr_key_results(id) on delete cascade,
   date date not null,
   target_at_date numeric,
   value_obtained numeric,
   observation text,
   created_at timestamptz not null default now()
 );

 create index if not exists collection_okr_key_results_okr_key_result_id_idx on public.collection_okr_key_results(okr_key_result_id);
 create index if not exists collection_okr_key_results_okr_key_result_id_date_idx on public.collection_okr_key_results(okr_key_result_id, date);
