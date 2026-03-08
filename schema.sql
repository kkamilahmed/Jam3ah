-- ============================================================
-- Jam3ah — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Masjid registration requests (before approval)
create table if not exists masjid_registrations (
  id              uuid default gen_random_uuid() primary key,
  masjid_name     text not null,
  address         text,
  masjid_phone    text,
  masjid_email    text not null,
  incharge_name   text,
  incharge_phone  text,
  status          text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz default now()
);

-- 2. Approved masjids (created on admin approval)
create table if not exists masjids (
  id                  uuid default gen_random_uuid() primary key,
  registration_id     uuid references masjid_registrations(id),
  user_id             uuid references auth.users(id),
  masjid_name         text not null,
  address             text,
  masjid_phone        text,
  masjid_email        text not null unique,
  incharge_name       text,
  incharge_phone      text,
  status              text default 'active' check (status in ('active', 'suspended')),
  theme               text default 'emerald',
  subdomain           text,
  website_enabled     boolean default false,
  onboarding_complete boolean default false,
  instagram           text,
  facebook            text,
  twitter             text,
  youtube             text,
  whatsapp            text,
  website_url         text,
  created_at          timestamptz default now()
);

-- 3. Prayer settings per masjid
create table if not exists prayer_settings (
  id              uuid default gen_random_uuid() primary key,
  masjid_id       uuid references masjids(id) unique,
  source          text default 'backend' check (source in ('backend', 'excel')),
  city            text default 'Toronto',
  country         text default 'Canada',
  latitude        text default '43.651070',
  longitude       text default '-79.347015',
  elevation       text default '76',
  timezone        text default 'America/Toronto',
  method          text default 'ISNA',
  asr_method      text default 'Standard',
  higher_lat_rule text default 'AngleBased',
  midnight_mode   text default 'Standard',
  fajr_adjust     int  default 0,
  dhuhr_adjust    int  default 0,
  asr_adjust      int  default 0,
  maghrib_adjust  int  default 0,
  isha_adjust     int  default 0,
  prayer_config   jsonb,  -- { fajr: { adhanMode, adhanOffset, adhanFixed, iqamaMode, iqamaOffset, iqamaFixed }, ... }
  extra_timings   jsonb,  -- { fajr: [], maghrib: [], jummah: ["1:15 PM"] }
  created_at      timestamptz default now()
);

-- Migration for existing installations (run in Supabase SQL Editor):
-- alter table prayer_settings add column if not exists prayer_config jsonb;
-- alter table prayer_settings add column if not exists extra_timings jsonb;

-- 4. Daily prayer times per masjid
create table if not exists prayer_times (
  id             uuid default gen_random_uuid() primary key,
  masjid_id      uuid references masjids(id),
  date           date not null,
  fajr           text,
  dhuhr          text,
  asr            text,
  maghrib        text,
  isha           text,
  fajr_adhan     text,
  fajr_iqama     text,
  dhuhr_adhan    text,
  dhuhr_iqama    text,
  asr_adhan      text,
  asr_iqama      text,
  maghrib_adhan  text,
  maghrib_iqama  text,
  isha_adhan      text,
  isha_iqama      text,
  fajr_iqama_2    text,   -- 2nd Fajr jamaat
  fajr_iqama_3    text,   -- 3rd Fajr jamaat
  maghrib_iqama_2 text,   -- 2nd Maghrib jamaat
  maghrib_iqama_3 text,   -- 3rd Maghrib jamaat
  jummah_1        text,   -- 1st Jummah khutbah (Fridays only)
  jummah_2        text,   -- 2nd Jummah khutbah
  jummah_3        text,   -- 3rd Jummah khutbah
  unique(masjid_id, date)
);

-- Migration for existing installations (run in Supabase SQL Editor):
-- alter table prayer_times add column if not exists fajr_adhan text;
-- alter table prayer_times add column if not exists fajr_iqama text;
-- alter table prayer_times add column if not exists dhuhr_adhan text;
-- alter table prayer_times add column if not exists dhuhr_iqama text;
-- alter table prayer_times add column if not exists asr_adhan text;
-- alter table prayer_times add column if not exists asr_iqama text;
-- alter table prayer_times add column if not exists maghrib_adhan text;
-- alter table prayer_times add column if not exists maghrib_iqama text;
-- alter table prayer_times add column if not exists isha_adhan text;
-- alter table prayer_times add column if not exists isha_iqama text;
-- alter table prayer_times add column if not exists fajr_iqama_2 text;
-- alter table prayer_times add column if not exists fajr_iqama_3 text;
-- alter table prayer_times add column if not exists maghrib_iqama_2 text;
-- alter table prayer_times add column if not exists maghrib_iqama_3 text;
-- alter table prayer_times add column if not exists jummah_1 text;
-- alter table prayer_times add column if not exists jummah_2 text;
-- alter table prayer_times add column if not exists jummah_3 text;

-- 5. Events per masjid
create table if not exists events (
  id          uuid default gen_random_uuid() primary key,
  masjid_id   uuid references masjids(id),
  title       text not null,
  description text,
  date        date,
  time        text,
  created_at  timestamptz default now()
);

-- 6. Questions submitted to masjid
create table if not exists questions (
  id          uuid default gen_random_uuid() primary key,
  masjid_id   uuid references masjids(id),
  name        text,
  email       text,
  question    text not null,
  answered    boolean default false,
  answer      text,
  created_at  timestamptz default now()
);

-- ── RLS ─────────────────────────────────────────────────────
alter table masjid_registrations enable row level security;
alter table masjids              enable row level security;
alter table prayer_settings      enable row level security;
alter table prayer_times         enable row level security;
alter table events               enable row level security;
alter table questions            enable row level security;

-- Anyone (anon) can submit a registration
create policy "anon_insert_registrations"
  on masjid_registrations for insert
  with check (true);

-- Authenticated users can read their own masjid
create policy "owner_select_masjid"
  on masjids for select
  using (auth.uid() = user_id);

create policy "owner_update_masjid"
  on masjids for update
  using (auth.uid() = user_id);

-- Prayer settings: owner only
create policy "owner_all_prayer_settings"
  on prayer_settings for all
  using (masjid_id in (select id from masjids where user_id = auth.uid()));

-- Prayer times: owner only
create policy "owner_all_prayer_times"
  on prayer_times for all
  using (masjid_id in (select id from masjids where user_id = auth.uid()));

-- Events: owner only
create policy "owner_all_events"
  on events for all
  using (masjid_id in (select id from masjids where user_id = auth.uid()));

-- Questions: anon can insert, owner can read/update
create policy "anon_insert_questions"
  on questions for insert
  with check (true);

create policy "owner_all_questions"
  on questions for all
  using (masjid_id in (select id from masjids where user_id = auth.uid()));
