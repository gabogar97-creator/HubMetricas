alter table if exists public.collection_nsms
  add column if not exists nsm_id bigint;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'collection_nsms'
      and column_name = 'nsmId'
  ) then
    execute 'update public.collection_nsms set nsm_id = "nsmId" where nsm_id is null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'collection_nsms'
      and column_name = 'nsm'
  ) then
    execute 'update public.collection_nsms set nsm_id = nsm where nsm_id is null';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'collection_nsms_nsm_id_fkey'
  ) then
    alter table public.collection_nsms
      add constraint collection_nsms_nsm_id_fkey
      foreign key (nsm_id)
      references public.nsms(id)
      on delete cascade;
  end if;
end $$;

create index if not exists collection_nsms_nsm_id_idx
  on public.collection_nsms(nsm_id);
