do $$
begin
  -- Allow read access for the Dashboard even if requests run as anon (e.g., session not attached).

  -- collection_nsms
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_nsms' and policyname = 'collection_nsms_select_anon_authenticated') then
    execute 'create policy "collection_nsms_select_anon_authenticated" on public.collection_nsms for select to anon, authenticated using (true)';
  end if;

  -- nsms
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nsms' and policyname = 'nsms_select_anon_authenticated') then
    execute 'create policy "nsms_select_anon_authenticated" on public.nsms for select to anon, authenticated using (true)';
  end if;

  -- projects
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_select_anon_authenticated') then
    execute 'create policy "projects_select_anon_authenticated" on public.projects for select to anon, authenticated using (true)';
  end if;

  -- okrs
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okrs' and policyname = 'okrs_select_anon_authenticated') then
    execute 'create policy "okrs_select_anon_authenticated" on public.okrs for select to anon, authenticated using (true)';
  end if;

  -- okr_key_results
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'okr_key_results' and policyname = 'okr_key_results_select_anon_authenticated') then
    execute 'create policy "okr_key_results_select_anon_authenticated" on public.okr_key_results for select to anon, authenticated using (true)';
  end if;

  -- collection_okr_key_results
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_okr_key_results' and policyname = 'collection_okr_key_results_select_anon_authenticated') then
    execute 'create policy "collection_okr_key_results_select_anon_authenticated" on public.collection_okr_key_results for select to anon, authenticated using (true)';
  end if;

  -- collection_rois
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_rois' and policyname = 'collection_rois_select_anon_authenticated') then
    execute 'create policy "collection_rois_select_anon_authenticated" on public.collection_rois for select to anon, authenticated using (true)';
  end if;
end $$;
