-- 001_subscribers.sql
-- Run this once in the Supabase SQL editor (Project → SQL → New query).
-- Idempotent: safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text not null default 'hero',
  status      text not null default 'active',
  user_agent  text,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Email is unique, case-insensitive. We already lowercase server-side, but
-- a functional unique index guarantees correctness against future callers.
create unique index if not exists subscribers_email_unique
  on public.subscribers (lower(email));

create index if not exists subscribers_created_at_idx
  on public.subscribers (created_at desc);

create index if not exists subscribers_source_idx
  on public.subscribers (source);

-- Keep updated_at fresh on row writes.
create or replace function public.subscribers_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscribers_set_updated_at on public.subscribers;
create trigger subscribers_set_updated_at
  before update on public.subscribers
  for each row execute function public.subscribers_set_updated_at();

-- Lock the table down. The server uses the service-role key which bypasses
-- RLS, so policy gates are zero for anon/authed clients reading directly.
alter table public.subscribers enable row level security;

-- Optional: if you ever expose a read endpoint with anon key, define an
-- explicit allow policy. Until then, no anon access whatsoever.
-- create policy "no anon read" on public.subscribers for select using (false);
