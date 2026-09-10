-- Anonymous page-view events: no identity, IP address, or browser fingerprint.
create table public.website_page_views (
  id uuid primary key,
  viewed_at timestamptz not null default now()
);
create index website_page_views_time_idx on public.website_page_views(viewed_at);
alter table public.website_page_views enable row level security;
revoke all on public.website_page_views from anon, authenticated;

create function public.record_website_view(p_event_id uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.website_page_views(id) values (p_event_id)
  on conflict (id) do nothing;
$$;
revoke all on function public.record_website_view(uuid) from public;
grant execute on function public.record_website_view(uuid) to anon, authenticated;

create function public.get_website_view_stats()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Asia/Jakarta')::date;
  result jsonb;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'total', count(*),
    'today', count(*) filter (where viewed_at >= (today::timestamp at time zone 'Asia/Jakarta')),
    'last7', count(*) filter (where viewed_at >= ((today - 6)::timestamp at time zone 'Asia/Jakarta')),
    'last30', count(*) filter (where viewed_at >= ((today - 29)::timestamp at time zone 'Asia/Jakarta')),
    'first_view_at', min(viewed_at),
    'updated_at', now()
  ) into result from public.website_page_views;
  return result;
end;
$$;
revoke all on function public.get_website_view_stats() from public, anon;
grant execute on function public.get_website_view_stats() to authenticated;
notify pgrst, 'reload schema';
