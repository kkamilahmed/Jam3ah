-- ============================================================
-- Jam3ah — Supabase Schema (live as of 2026-04-26)
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
  city                text,
  province            text,
  postal_code         text,
  country             text default 'Canada',
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
  id                     uuid default gen_random_uuid() primary key,
  masjid_id              uuid references masjids(id) unique,
  source                 text default 'backend' check (source in ('backend', 'excel')),
  latitude               text default '43.651070',
  longitude              text default '-79.347015',
  elevation              text default '76',
  timezone               text default 'America/Toronto',
  method                 text default 'NorthAmerica',
  madhab                 text default 'Standard',
  higher_lat_rule        text default 'AngleBased',
  polar_circle_resolution text default 'AqrabBalad',
  shafaq                 text default 'General',
  rounding               text default 'Nearest',
  midnight_mode          text default 'Standard',
  adjust_fajr            int  default 0,
  adjust_sunrise         int  default 0,
  adjust_dhuhr           int  default 0,
  adjust_asr             int  default 0,
  adjust_maghrib         int  default 0,
  adjust_isha            int  default 0,
  fajr_angle             text,
  isha_angle             text,
  isha_interval          text,
  maghrib_angle          text,
  presets                jsonb,  -- array of PrayerPreset objects
  prayer_config          jsonb,  -- { fajr: { adhanMode, adhanOffset, ... }, ... }
  jummah_config          jsonb,  -- { fajr: [], maghrib: [], jummah: [], jummahSlots: [], weekendIsha: {} }
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- 4. Daily prayer times per masjid
create table if not exists prayer_times (
  id              uuid default gen_random_uuid() primary key,
  masjid_id       uuid references masjids(id),
  date            date not null,
  fajr            text,
  sunrise         text,
  dhuhr           text,
  asr             text,
  maghrib         text,
  isha            text,
  fajr_adhan      text,
  dhuhr_adhan     text,
  asr_adhan       text,
  maghrib_adhan   text,
  isha_adhan      text,
  fajr_iqama      text,
  dhuhr_iqama     text,
  asr_iqama       text,
  maghrib_iqama   text,
  isha_iqama      text,
  fajr_iqama_2    text,
  fajr_iqama_3    text,
  maghrib_iqama_2 text,
  maghrib_iqama_3 text,
  jummah_1        text,
  jummah_2        text,
  jummah_3        text,
  unique(masjid_id, date)
);
create index if not exists idx_prayer_times_masjid_date on prayer_times(masjid_id, date);

-- 5. Events per masjid
create table if not exists events (
  id          uuid default gen_random_uuid() primary key,
  masjid_id   uuid references masjids(id),
  title       text not null,
  description text,
  date        date,
  time        text,
  location    text,
  created_at  timestamptz default now()
);

-- 6. Announcements per masjid
create table if not exists announcements (
  id         uuid default gen_random_uuid() primary key,
  masjid_id  uuid references masjids(id) on delete cascade,
  title      text not null,
  body       text,
  pinned     boolean default false,
  expires_at date,
  created_at timestamptz default now()
);

-- 7. Questions submitted to masjid
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
alter table announcements        enable row level security;
alter table questions            enable row level security;

-- Anyone (anon) can submit a registration
create policy "anon_insert_registrations"
  on masjid_registrations for insert
  with check (true);

-- Authenticated users can read/update their own masjid
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

-- Announcements: owner only
create policy "owner_all_announcements"
  on announcements for all
  using (masjid_id in (select id from masjids where user_id = auth.uid()));

-- Questions: anon can insert, owner can read/update
create policy "anon_insert_questions"
  on questions for insert
  with check (true);

create policy "owner_all_questions"
  on questions for all
  using (masjid_id in (select id from masjids where user_id = auth.uid()));
