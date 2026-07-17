# Jam3ah

Jam3ah is a masjid (mosque) management platform: masjid admins sign up, get
approved, and manage prayer times, events, and announcements from a dashboard.
Public-facing pages (home, TV screen display) read that data live.

## Stack & commands

Frontend is a Vite + React 19 + TypeScript app at the repo root. There is no
frontend test suite.

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then build (`vite build`); this is
  the closest thing to a full validation pass, run it after non-trivial changes
- `npm run lint` — ESLint (flat config in `eslint.config.js`)

`Backend/` is a separate, vendored PHP library (`islamic-network/prayer-times`,
Composer package) exposing one endpoint, `Backend/api/generate_year.php`
(`php -S localhost:8080 -t Backend`). **It is not called from the frontend**
(no code references `VITE_BACKEND_URL`) — it was superseded by TypeScript
ports of the same algorithm. Only touch `Backend/` if asked to work on that
legacy PHP API specifically; its tests run via `vendor/bin/phpunit
Backend/tests/TimingsTest.php` after `composer install` in `Backend/`.

`toronto-hifz-academy.jsx` at the repo root is a standalone reference mockup,
not imported anywhere in `src/` and not part of the build.

## Architecture

- **Routing** (`src/App.tsx`): `/` landing, `/login` `/signup` `/onboarding`
  (masjid registration → `WelcomePage`), `/home/:tab` the admin dashboard
  (`HomePage.tsx`), `/home/tvscreen` a kiosk display, `/admin` the internal
  super-admin console (`AdminPage.tsx`) for approving/rejecting masjid
  registrations.
- **Data layer** (`src/lib/supabase.ts`): two Supabase clients — `supabase`
  (anon key, normal reads/auth) and `supabaseAdmin` (service-role key). The
  service-role client is only meant for `AdminPage` (creating auth users on
  approval); the code comments note this should really be a server-side Edge
  Function. Schema lives in `schema.sql` (masjid_registrations → masjids →
  prayer_settings, events, announcements, etc. — run manually via Supabase
  SQL Editor, no migration tool).
- **Dashboard** (`src/dashboard/`, driven by `HomePage.tsx`): tabs live in
  `src/dashboard/tabs/` (`OverviewTab`, `PrayerTimesTab`, `EventsTab`,
  `SettingsTab`) and are switched via the `:tab` route param, not local state.
  The route supports five tab values (`overview`, `prayer-times`, `events`,
  `announcements`, `settings`); `announcements` renders `EventsTab` with its
  `eventsSubTab` prop rather than a separate component file. Shared reusable
  widgets (custom `Select`, `DatePicker`, `LocationMap`, `BatchControl`,
  `Toast`) live in `src/dashboard/components/`. Per-tab UI state (active tab,
  dark mode, tutorial-seen flags, theme) is persisted to `localStorage`, not
  the database.
- **Prayer time calculation has two independent implementations** — know
  which one you're editing:
  - `src/lib/prayerTimes.ts`: a from-scratch TS port of the PrayTimes.org
    algorithm (mirrors `Backend/src/PrayerTimes/PrayerTimes.php`), used only
    by `WelcomePage.tsx` onboarding to preview yearly times for preset
    calculation methods.
  - `src/dashboard/constants.ts` (`generateYearAdhan`/`generateMonthAdhan`):
    wraps the `adhan` npm package and is what the live dashboard
    (`PrayerTimesTab`, batch editing) actually uses, driven by the
    `prayer_settings` row per masjid (method, madhab, adjustments, etc.).
  If a calculation-method or algorithm change is requested, check whether it
  needs to apply to both.
- **Theming**: `src/dashboard/themes.ts` defines the same 5 named accent
  themes (`emerald`, `amber`, `sky`, `violet`, `rose`) described in
  `DESIGN.md`; a masjid picks one, stored on `masjids.theme`.

## Conventions

- **`DESIGN.md` is the visual design system** (colors, typography, spacing,
  component styles) — consult it before styling any UI, dashboard or
  otherwise. Key non-obvious rules: every component uses a flat **2px border
  radius** (no `rounded-lg`/`rounded-xl`), cards use **zero box-shadow**
  (depth comes only from stepping up the `surface-container-*` scale), and
  the only expressive color is the active accent theme — don't introduce new
  colors outside the surface/accent/error scales.
- `.env` is gitignored; `.env.example` is the committed template — copy it to
  `.env` and fill in real Supabase keys locally, never commit `.env` itself.
- User-facing feedback in the dashboard uses the shared `Toast` component
  (`showToast`), not `alert()`. `confirm()` is still used for destructive
  action confirmations (delete event/announcement).
- TypeScript is strict (`strict`, `noUnusedLocals`, `noUnusedParameters` all
  on in `tsconfig.app.json`) — unused imports/vars will fail `npm run build`.
