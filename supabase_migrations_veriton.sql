-- Veriton entity tables (single-user, RLS disabled to match rest of LifeOS1)

create table if not exists veriton_track (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lyrics text,
  genre text,
  "genreSecondary" text,
  "genreBlend" numeric default 100,
  mood text,
  delivery text,
  gender text default 'Male',
  "voiceTypes" jsonb default '[]',
  "voiceBlend" jsonb default '{}',
  "voiceProfileId" text,
  bpm numeric default 120,
  key text default 'C Major',
  duration numeric default 0,
  "coverArtUrl" text,
  "audioFileUrl" text,
  "stemUrls" jsonb default '{}',
  status text default 'generating',
  "id3Tags" jsonb default '{}',
  "fxSettings" jsonb default '{}',
  "playlistIds" jsonb default '[]',
  created_at timestamptz not null default now()
);
alter table veriton_track disable row level security;

create table if not exists veriton_playlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "coverMosaicUrls" jsonb default '[]',
  "trackIds" jsonb default '[]',
  color text default '#DC143C',
  created_at timestamptz not null default now()
);
alter table veriton_playlist disable row level security;

create table if not exists veriton_videoproject (
  id uuid primary key default gen_random_uuid(),
  "trackId" text not null,
  "creationMode" text default 'auto-pilot',
  "inputData" jsonb default '{}',
  status text default 'rendering',
  "outputVideoUrl" text,
  "subtitleStyle" jsonb default '{}',
  "transitionSpeed" numeric default 1,
  "aspectRatio" text default '16:9',
  resolution text default '4K',
  fps numeric default 30,
  "templateName" text,
  created_at timestamptz not null default now()
);
alter table veriton_videoproject disable row level security;

create table if not exists veriton_voiceprofile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "voiceId" text,
  "consentGiven" boolean default false,
  "uploadedFileUrl" text,
  "suggestedBpm" numeric,
  created_at timestamptz not null default now()
);
alter table veriton_voiceprofile disable row level security;

-- Storage bucket for cover art / audio / photo uploads (create via Supabase dashboard
-- Storage tab if this insert fails due to permissions):
insert into storage.buckets (id, name, public)
values ('veriton-uploads', 'veriton-uploads', true)
on conflict (id) do nothing;
