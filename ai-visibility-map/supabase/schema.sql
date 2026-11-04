-- AI Visibility Map: schema v0.1 (company-level only, no personal data)

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  city text,
  country text,
  size_band text,
  website text,
  is_sample boolean not null default true,   -- true = demo data, shown as SAMPLE in the UI
  created_at timestamptz default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  city text not null,
  group_type text not null check (group_type in ('test','control'))
);

create table prompts (
  id text primary key,                        -- P01 to P10
  type text not null,
  template text not null
);

create table runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  location_id uuid references locations(id),
  prompt_id text not null references prompts(id),
  engine text not null check (engine in ('chatgpt','gemini','perplexity','claude')),
  model_version text,
  repeat_no int not null default 1,
  raw_answer text,
  cost_usd numeric(10,5) default 0,
  is_sample boolean not null default true,
  ran_at timestamptz default now()
);

create table scores (
  run_id uuid primary key references runs(id) on delete cascade,
  mentioned boolean not null,
  recommended boolean not null,
  cited boolean not null,
  position int,
  sentiment smallint check (sentiment in (-1,0,1)),
  score numeric(5,2) not null,
  description text,
  positive_gaps text[],
  negative_gaps text[]
);

create table competitors_seen (
  run_id uuid references runs(id) on delete cascade,
  name text not null,
  rank int,
  primary key (run_id, name)
);

-- Views the dashboard and Excel export read from
create view company_scores as
select c.id as company_id, c.name, c.industry, c.city, r.engine,
       round(avg(s.score),1) as avg_score,
       round(stddev(s.score),1) as score_spread,
       count(*) as runs,
       bool_and(r.is_sample) as is_sample
from companies c join runs r on r.company_id = c.id join scores s on s.run_id = r.id
group by c.id, c.name, c.industry, c.city, r.engine;

create view group_comparison as
select l.group_type, c.industry, round(avg(s.score),1) as avg_score, count(*) as runs
from locations l join companies c on c.id = l.company_id
join runs r on r.location_id = l.id join scores s on s.run_id = r.id
group by l.group_type, c.industry;

create view market_view as
select industry, city, round(avg(avg_score),1) as avg_score, count(distinct company_id) as companies
from company_scores group by industry, city;

-- Security: lock tables, add read policies later
alter table companies enable row level security;
alter table locations enable row level security;
alter table prompts enable row level security;
alter table runs enable row level security;
alter table scores enable row level security;
alter table competitors_seen enable row level security;
