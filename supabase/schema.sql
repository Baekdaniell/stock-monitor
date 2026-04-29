-- ============================================================
-- Stock Monitor — Supabase 스키마 설정
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- ============================================================

-- ── 보유 종목 테이블 ──────────────────────────────────────────
create table if not exists public.holdings (
  id         uuid    default gen_random_uuid() primary key,
  user_id    uuid    references auth.users(id) on delete cascade not null,
  symbol     text    not null,
  name       text    not null default '',
  shares     numeric not null default 0,
  avg_cost   numeric not null default 0,
  buy_date   text,
  created_at timestamptz default now() not null,
  constraint holdings_user_symbol_unique unique (user_id, symbol)
);

-- ── 관심 종목 테이블 ──────────────────────────────────────────
create table if not exists public.watchlist (
  id         uuid    default gen_random_uuid() primary key,
  user_id    uuid    references auth.users(id) on delete cascade not null,
  symbol     text    not null,
  name       text    not null default '',
  added_at   timestamptz default now() not null,
  created_at timestamptz default now() not null,
  constraint watchlist_user_symbol_unique unique (user_id, symbol)
);

-- ── Row Level Security 활성화 ─────────────────────────────────
alter table public.holdings  enable row level security;
alter table public.watchlist enable row level security;

-- ── RLS 정책: 본인 데이터만 접근 가능 ─────────────────────────
create policy "holdings: 본인 데이터 CRUD"
  on public.holdings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "watchlist: 본인 데이터 CRUD"
  on public.watchlist for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
