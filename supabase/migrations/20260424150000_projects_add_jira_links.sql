alter table if exists public.projects
  add column if not exists jira_links text;
