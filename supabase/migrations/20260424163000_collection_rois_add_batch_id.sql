-- Add a logical collection id to group ROI entries created in the same coleta

create extension if not exists "pgcrypto";

alter table if exists public.collection_rois
add column if not exists collection_batch_id uuid;

with g as (
  select
    date::date as d,
    coalesce(description, '') as descr,
    gen_random_uuid() as bid
  from public.collection_rois
  where collection_batch_id is null
  group by date::date, coalesce(description, '')
)
update public.collection_rois r
set collection_batch_id = g.bid
from g
where r.collection_batch_id is null
  and r.date::date = g.d
  and coalesce(r.description, '') = g.descr;

alter table if exists public.collection_rois
alter column collection_batch_id set not null;

create index if not exists collection_rois_collection_batch_id_idx
on public.collection_rois (collection_batch_id);
