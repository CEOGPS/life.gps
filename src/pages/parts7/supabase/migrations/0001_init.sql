-- LifeOS1 core schema
-- Run via Supabase SQL editor or `supabase db push`

create extension if not exists "pgcrypto";

-- ── Profiles (mirrors auth.users) ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Integrations panel: OAuth tokens per provider ─────────────
create table if not exists public.platform_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,               -- 'telegram','instagram','gmail','tiktok', etc.
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  provider_account_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- ── CRM / Contacts panels ──────────────────────────────────────
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  emails text[] default '{}',
  phones text[] default '{}',
  company text,
  title text,
  source text,                          -- 'personal','crm','import', etc.
  tags text[] default '{}',
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  stage text not null default 'new',
  value_cents bigint default 0,
  currency text default 'usd',
  close_date date,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Communications panel (multi-platform messages) ────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  platform text not null,               -- 'telegram','whatsapp','sms', etc.
  direction text not null check (direction in ('inbound','outbound')),
  body text,
  attachments jsonb default '[]'::jsonb,
  external_id text,
  sent_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

-- ── Email panel ────────────────────────────────────────────────
create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,               -- 'gmail','outlook'
  thread_id text,
  from_address text,
  to_addresses text[] default '{}',
  subject text,
  body text,
  is_read boolean default false,
  sent_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

-- ── Projects / Tasks (business, office, creator panels) ───────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  due_date timestamptz,
  priority text default 'normal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Journal panel ──────────────────────────────────────────────
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  body text not null,
  mood text,
  tags text[] default '{}',
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── Finance panel ──────────────────────────────────────────────
create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account text,
  category text,
  amount_cents bigint not null,
  currency text default 'usd',
  description text,
  occurred_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

-- ── Media panel (uploads, R2-backed) ───────────────────────────
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,           -- R2 key or Supabase storage path
  mime_type text,
  file_name text,
  size_bytes bigint,
  folder text,
  created_at timestamptz not null default now()
);

-- ── Row Level Security: users only see their own rows ─────────
alter table public.profiles enable row level security;
alter table public.platform_tokens enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.messages enable row level security;
alter table public.email_messages enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.media_assets enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles','platform_tokens','contacts','deals','messages',
    'email_messages','projects','tasks','journal_entries',
    'finance_transactions','media_assets'
  ])
  loop
    execute format('
      create policy "select_own_%1$s" on public.%1$s
        for select using (auth.uid() = %2$s);
      create policy "insert_own_%1$s" on public.%1$s
        for insert with check (auth.uid() = %2$s);
      create policy "update_own_%1$s" on public.%1$s
        for update using (auth.uid() = %2$s);
      create policy "delete_own_%1$s" on public.%1$s
        for delete using (auth.uid() = %2$s);
    ', t, case when t = 'profiles' then 'id' else 'user_id' end);
  end loop;
end $$;

-- ── Generic KV persistence (ported from prior LifeOS1 build) ──
-- Many legacy panels persist arbitrary JSON via key/value rather than
-- dedicated tables. Keep this alongside the relational tables above.
create table if not exists public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  data_key text not null,
  data_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, data_key)
);

alter table public.user_data enable row level security;

create policy "select_own_user_data" on public.user_data
  for select using (auth.uid() = user_id);
create policy "insert_own_user_data" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "update_own_user_data" on public.user_data
  for update using (auth.uid() = user_id);
create policy "delete_own_user_data" on public.user_data
  for delete using (auth.uid() = user_id);
