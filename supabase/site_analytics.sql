-- Run once in the Supabase SQL editor (the project used by Leverage OS).
create table if not exists public.ls_events (
  id bigserial primary key, created_at timestamptz not null default now(),
  site text not null default 'leverage-strategic', event text not null,
  visitor_id text, session_id text, path text, title text, referrer text,
  utm_source text, utm_medium text, utm_campaign text, utm_term text,
  props jsonb not null default '{}'::jsonb, country text, region text, city text,
  device text, ip_hash text, viewport int);
create index if not exists ls_events_created_idx on public.ls_events (site, created_at desc);
create index if not exists ls_events_session_idx on public.ls_events (session_id, created_at);
alter table public.ls_events enable row level security;  -- no policies: only the service role (server) can read/write

create or replace view public.v_ls_daily as
select site, date_trunc('day', created_at)::date as day, count(distinct visitor_id) as visitors, count(distinct session_id) as sessions,
  count(*) filter (where event='pageview') as pageviews from public.ls_events group by 1,2;
create or replace view public.v_ls_top_pages as
select site, path, count(*) as views, count(distinct visitor_id) as visitors from public.ls_events where event='pageview' group by 1,2;
create or replace view public.v_ls_sources as
select site, coalesce(nullif(utm_source,''), nullif(substring(referrer from '://([^/]+)'),''), 'direct') as source, coalesce(utm_medium,'') as medium, count(distinct session_id) as sessions
from public.ls_events where event='pageview' group by 1,2,3;
create or replace view public.v_ls_journeys as
select site, session_id, min(created_at) as started, max(country) as country, max(device) as device,
  string_agg(case when event='pageview' then path else event||':'||coalesce(props->>'label',props->>'file','') end, ' > ' order by created_at) as journey
from public.ls_events where event in ('pageview','click','download','lead','booking_click','email_click') group by 1,2;
create or replace view public.v_ls_downloads as
select site, created_at, session_id, country, props->>'file' as file, path from public.ls_events where event='download';
create or replace view public.v_ls_leads as
select site, created_at, session_id, country, path, props->>'kind' as kind, props->>'report' as report from public.ls_events where event='lead';
create or replace view public.v_ls_clicks as
select site, props->>'section' as section, props->>'label' as label, count(*) as clicks from public.ls_events where event in ('click','booking_click','email_click','outbound_click') group by 1,2,3;

-- ===== Journeys, drop-off, heatmaps, organic search =====
create or replace view public.v_ls_landing as
select distinct on (site, session_id) site, session_id, created_at, path as landing_path, referrer, utm_source, utm_medium, country, device
from public.ls_events where event='pageview' order by site, session_id, created_at;
create or replace view public.v_ls_exit_pages as
select distinct on (site, session_id) site, session_id, path as exit_path, created_at
from public.ls_events where event='pageview' order by site, session_id, created_at desc;
create or replace view public.v_ls_funnel as
select site,
  count(distinct session_id) as sessions,
  count(distinct session_id) filter (where event='pageview' and path like '%/work/%') as viewed_selected_work,
  count(distinct session_id) filter (where event='pageview' and path like '%/work/%' and path not like '%/work/' and path not like '%/work/index.html') as opened_case_study,
  count(distinct session_id) filter (where event='download') as downloaded_report,
  count(distinct session_id) filter (where event in ('booking_click','email_click')) as clicked_book_or_email,
  count(distinct session_id) filter (where event='form_start') as started_form,
  count(distinct session_id) filter (where event='lead') as submitted_lead
from public.ls_events group by site;
create or replace view public.v_ls_sections as
select site, path, props->>'id' as section, count(distinct session_id) as sessions, sum((props->>'seconds')::numeric) as total_seconds,
  round(avg((props->>'seconds')::numeric),1) as avg_seconds from public.ls_events where event='section' group by 1,2,3;
create or replace view public.v_ls_click_heat as
select site, path, ((props->>'x')::int/5)*5 as x_pct, ((props->>'y')::int/100)*100 as y_px, count(*) as clicks
from public.ls_events where event in ('click','download','booking_click','email_click','outbound_click') and props ? 'x' group by 1,2,3,4;
create or replace view public.v_ls_cursor_heat as
select e.site, e.path, (pt->>0)::int as x_pct, (pt->>1)::int*50 as y_px, count(*) as samples
from public.ls_events e, jsonb_array_elements(e.props->'pts') pt where e.event='mouse' group by 1,2,3,4;
create or replace view public.v_ls_rage_clicks as
select site, path, ((props->>'y')::int/100)*100 as y_px, count(*) as rage_clicks from public.ls_events where event='rage_click' group by 1,2,3;
create or replace view public.v_ls_organic as
select site, landing_path, count(*) as organic_sessions from public.v_ls_landing
where utm_source is null and referrer ~* '(^|[/.])(google|bing|duckduckgo|yahoo|ecosia|baidu)\.' group by 1,2;

-- Google Search Console data (filled daily by api/gsc-sync.js): the only source of real search queries.
create table if not exists public.ls_search_console (
  site text not null default 'leverage-strategic', date date not null, query text not null, page text not null,
  country text not null, device text not null, clicks int not null, impressions int not null, ctr numeric, position numeric,
  primary key (site, date, query, page, country, device));
alter table public.ls_search_console enable row level security;
create or replace view public.v_ls_search_queries as
select site, query, sum(clicks) as clicks, sum(impressions) as impressions, round(sum(clicks)::numeric/nullif(sum(impressions),0),4) as ctr,
  round(sum(position*impressions)/nullif(sum(impressions),0),1) as avg_position from public.ls_search_console group by 1,2;
create or replace view public.v_ls_search_pages as
select site, page, sum(clicks) as clicks, sum(impressions) as impressions, round(sum(position*impressions)/nullif(sum(impressions),0),1) as avg_position from public.ls_search_console group by 1,2;

-- Website requests (form submissions). Leverage OS reads this table / view as the lead inbox.
create table if not exists public.ls_leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  site text, name text, email text, company text, need text, timeline text, delivery text, message text,
  path text, visitor_id text, referrer text, country text, status text default 'new'
);
alter table public.ls_leads enable row level security;  -- no policies: only the service role can read/write
create or replace view public.v_ls_lead_inbox as
  select l.*, (select count(*) from public.ls_events e where e.visitor_id = l.visitor_id) as events_before_lead,
         (select string_agg(distinct e.path, ' > ') from public.ls_events e where e.visitor_id = l.visitor_id) as pages_seen
  from public.ls_leads l order by l.created_at desc;
