do $$
begin
  -- Core domain tables used by the Dashboard.
  -- If RLS is enabled without policies, the frontend will not be able to read histories.

  -- Enable RLS
  execute 'alter table if exists public.projects enable row level security';
  execute 'alter table if exists public.collection_rois enable row level security';
  execute 'alter table if exists public.nsms enable row level security';
  execute 'alter table if exists public.collection_nsms enable row level security';
  execute 'alter table if exists public.okrs enable row level security';
  execute 'alter table if exists public.okr_key_results enable row level security';
  execute 'alter table if exists public.collection_okr_key_results enable row level security';
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'collection_okr_results'
  ) then
    execute 'alter table public.collection_okr_results enable row level security';
  end if;
end $$;

-- Projects
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_select_authenticated') then
    execute 'create policy "projects_select_authenticated" on public.projects for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_insert_authenticated') then
    execute 'create policy "projects_insert_authenticated" on public.projects for insert to authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_update_authenticated') then
    execute 'create policy "projects_update_authenticated" on public.projects for update to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_delete_authenticated') then
    execute 'create policy "projects_delete_authenticated" on public.projects for delete to authenticated using (true)';
  end if;
end $$;

-- ROI collections
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_rois' and policyname = 'collection_rois_select_authenticated') then
    execute 'create policy "collection_rois_select_authenticated" on public.collection_rois for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_rois' and policyname = 'collection_rois_insert_authenticated') then
    execute 'create policy "collection_rois_insert_authenticated" on public.collection_rois for insert to authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_rois' and policyname = 'collection_rois_update_authenticated') then
    execute 'create policy "collection_rois_update_authenticated" on public.collection_rois for update to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_rois' and policyname = 'collection_rois_delete_authenticated') then
    execute 'create policy "collection_rois_delete_authenticated" on public.collection_rois for delete to authenticated using (true)';
  end if;
end $$;

-- NSMs
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nsms' and policyname = 'nsms_select_authenticated') then
    execute 'create policy "nsms_select_authenticated" on public.nsms for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nsms' and policyname = 'nsms_insert_authenticated') then
    execute 'create policy "nsms_insert_authenticated" on public.nsms for insert to authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nsms' and policyname = 'nsms_update_authenticated') then
    execute 'create policy "nsms_update_authenticated" on public.nsms for update to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nsms' and policyname = 'nsms_delete_authenticated') then
    execute 'create policy "nsms_delete_authenticated" on public.nsms for delete to authenticated using (true)';
  end if;
end $$;

-- NSM collections
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_nsms' and policyname = 'collection_nsms_select_authenticated') then
    execute 'create policy "collection_nsms_select_authenticated" on public.collection_nsms for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_nsms' and policyname = 'collection_nsms_insert_authenticated') then
    execute 'create policy "collection_nsms_insert_authenticated" on public.collection_nsms for insert to authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_nsms' and policyname = 'collection_nsms_update_authenticated') then
    execute 'create policy "collection_nsms_update_authenticated" on public.collection_nsms for update to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_nsms' and policyname = 'collection_nsms_delete_authenticated') then
    execute 'create policy "collection_nsms_delete_authenticated" on public.collection_nsms for delete to authenticated using (true)';
  end if;
end $$;

-- OKRs
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okrs' and policyname = 'okrs_select_authenticated') then
    execute 'create policy "okrs_select_authenticated" on public.okrs for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okrs' and policyname = 'okrs_insert_authenticated') then
    execute 'create policy "okrs_insert_authenticated" on public.okrs for insert to authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okrs' and policyname = 'okrs_update_authenticated') then
    execute 'create policy "okrs_update_authenticated" on public.okrs for update to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okrs' and policyname = 'okrs_delete_authenticated') then
    execute 'create policy "okrs_delete_authenticated" on public.okrs for delete to authenticated using (true)';
  end if;
end $$;

-- OKR key results
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okr_key_results' and policyname = 'okr_key_results_select_authenticated') then
    execute 'create policy "okr_key_results_select_authenticated" on public.okr_key_results for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okr_key_results' and policyname = 'okr_key_results_insert_authenticated') then
    execute 'create policy "okr_key_results_insert_authenticated" on public.okr_key_results for insert to authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okr_key_results' and policyname = 'okr_key_results_update_authenticated') then
    execute 'create policy "okr_key_results_update_authenticated" on public.okr_key_results for update to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okr_key_results' and policyname = 'okr_key_results_delete_authenticated') then
    execute 'create policy "okr_key_results_delete_authenticated" on public.okr_key_results for delete to authenticated using (true)';
  end if;
end $$;

-- OKR collections (canonical)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_key_results' and policyname = 'collection_okr_key_results_select_authenticated') then
    execute 'create policy "collection_okr_key_results_select_authenticated" on public.collection_okr_key_results for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_key_results' and policyname = 'collection_okr_key_results_insert_authenticated') then
    execute 'create policy "collection_okr_key_results_insert_authenticated" on public.collection_okr_key_results for insert to authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_key_results' and policyname = 'collection_okr_key_results_update_authenticated') then
    execute 'create policy "collection_okr_key_results_update_authenticated" on public.collection_okr_key_results for update to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_key_results' and policyname = 'collection_okr_key_results_delete_authenticated') then
    execute 'create policy "collection_okr_key_results_delete_authenticated" on public.collection_okr_key_results for delete to authenticated using (true)';
  end if;
end $$;

-- OKR collections (legacy)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'collection_okr_results'
  ) then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_results' and policyname = 'collection_okr_results_select_authenticated') then
      execute 'create policy "collection_okr_results_select_authenticated" on public.collection_okr_results for select to authenticated using (true)';
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_results' and policyname = 'collection_okr_results_insert_authenticated') then
      execute 'create policy "collection_okr_results_insert_authenticated" on public.collection_okr_results for insert to authenticated with check (true)';
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_results' and policyname = 'collection_okr_results_update_authenticated') then
      execute 'create policy "collection_okr_results_update_authenticated" on public.collection_okr_results for update to authenticated using (true) with check (true)';
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_results' and policyname = 'collection_okr_results_delete_authenticated') then
      execute 'create policy "collection_okr_results_delete_authenticated" on public.collection_okr_results for delete to authenticated using (true)';
    end if;
  end if;
end $$;
