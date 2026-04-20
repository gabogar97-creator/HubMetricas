update public.ops_sprints
set deadline_accuracy =
  case
    when coalesce(deadlines_agreed, 0) = 0 and coalesce(deadlines_met, 0) = 0 then 1
    when coalesce(deadlines_agreed, 0) > 0 then (coalesce(deadlines_met, 0)::numeric / nullif(coalesce(deadlines_agreed, 0), 0)::numeric)
    else null
  end
where true;
