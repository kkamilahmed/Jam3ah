/**
 * Prayer Times Calculator — TypeScript
 * Same algorithm as Backend/src/PrayerTimes/PrayerTimes.php
 * (Both are ports of the original PrayTimes.js from praytimes.org)
 */

// ─── Degree math ─────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;
const dsin  = (d: number) => Math.sin(d * D2R);
const dcos  = (d: number) => Math.cos(d * D2R);
const dtan  = (d: number) => Math.tan(d * D2R);
const darccos  = (x: number) => Math.acos(Math.max(-1, Math.min(1, x))) / D2R;
const darcsin  = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) / D2R;
const darctan2 = (y: number, x: number) => Math.atan2(y, x) / D2R;
const fixAngle = (a: number) => fix(a, 360);
const fixHour  = (a: number) => fix(a, 24);
function fix(a: number, b: number) {
  a = a - b * Math.floor(a / b);
  return a < 0 ? a + b : a;
}

// ─── Astronomy ───────────────────────────────────────────────────────────────
function julianDate(y: number, m: number, d: number): number {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPosition(jd: number) {
  const D    = jd - 2451545.0;
  const g    = fixAngle(357.529 + 0.98560028 * D);
  const q    = fixAngle(280.459 + 0.98564736 * D);
  const L    = fixAngle(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g));
  const e    = 23.439 - 0.00000036 * D;
  const RA   = darctan2(dcos(e) * dsin(L), dcos(L)) / 15;
  return {
    equation:    q / 15 - fixHour(RA),
    declination: darcsin(dsin(e) * dsin(L)),
  };
}

// ─── Core iterators (t = hours, passed as t/24 for JD offset) ────────────────
function midDay(jd: number, t: number): number {
  return fixHour(12 - sunPosition(jd + t / 24).equation);
}

function angleTime(jd: number, lat: number, angle: number, t: number, dir: "CCW" | "CW"): number {
  const { declination } = sunPosition(jd + t / 24);
  const z = midDay(jd, t);
  const v = darccos(
    (-dsin(angle) - dsin(declination) * dsin(lat)) / (dcos(declination) * dcos(lat))
  ) / 15;
  return z + (dir === "CCW" ? -v : v);
}

function asrT(jd: number, lat: number, factor: number, t: number): number {
  const { declination } = sunPosition(jd + t / 24);
  const angle = -(1 / D2R) * Math.atan(1 / (factor + dtan(Math.abs(lat - declination))));
  return angleTime(jd, lat, angle, t, "CW");
}

function iterate(fn: (t: number) => number, init: number, n = 8): number {
  let t = init;
  for (let i = 0; i < n; i++) t = fn(t);
  return t;
}

// ─── Methods ─────────────────────────────────────────────────────────────────
interface MethodCfg {
  fajr: number;
  isha?: number;
  ishaMin?: number;   // minutes after sunset
  maghribMin?: number;
  asr?: number;       // 1 = Shafi/Maliki/Hanbali, 2 = Hanafi
}

const METHODS: Record<string, MethodCfg> = {
  ISNA:      { fajr: 15,   isha: 15 },
  MWL:       { fajr: 18,   isha: 17 },
  EGYPTIAN:  { fajr: 19.5, isha: 17.5 },
  EGYPT:     { fajr: 19.5, isha: 17.5 },
  MAKKAH:    { fajr: 18.5, ishaMin: 90 },
  KARACHI:   { fajr: 18,   isha: 18 },
  GULF:      { fajr: 19.5, ishaMin: 90 },
  KUWAIT:    { fajr: 18,   isha: 17.5 },
  QATAR:     { fajr: 18,   ishaMin: 90 },
  SINGAPORE: { fajr: 20,   isha: 18 },
  TURKEY:    { fajr: 18,   isha: 17 },
  DUBAI:     { fajr: 18.2, isha: 18.2 },
  JORDAN:    { fajr: 18,   isha: 18 },
};

// ─── Timezone offset ─────────────────────────────────────────────────────────
function tzOffset(timezone: string, date: Date): number {
  try {
    const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const loc = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return (loc.getTime() - utc.getTime()) / 3600000;
  } catch {
    return 0;
  }
}

// ─── Time formatting ─────────────────────────────────────────────────────────
function toHHMM(h: number): string {
  h = fixHour(h);
  const hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) return toHHMM(hh + 1);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────
export interface PrayerDay {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export function generateYearPrayerTimes(
  lat: number,
  lng: number,
  timezone: string,
  method: string,
  year: number
): PrayerDay[] {
  const cfg = METHODS[method.toUpperCase()] ?? METHODS.ISNA;
  const asrFactor = cfg.asr ?? 1;
  const results: PrayerDay[] = [];

  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const Y = d.getFullYear(), M = d.getMonth() + 1, D = d.getDate();
    const jd     = julianDate(Y, M, D);
    const offset = tzOffset(timezone, d) - lng / 15;   // civil tz - solar tz

    const fajr    = iterate(t => angleTime(jd, lat, cfg.fajr, t, "CCW"), 5)  + offset;
    const sunrise = iterate(t => angleTime(jd, lat, 0.833,    t, "CCW"), 6)  + offset;
    const dhuhr   = iterate(t => midDay(jd, t),                          12) + offset;
    const asr     = iterate(t => asrT(jd, lat, asrFactor, t),            13) + offset;
    const sunset  = iterate(t => angleTime(jd, lat, 0.833,    t, "CW"),  18) + offset;
    const maghrib = cfg.maghribMin ? sunset + cfg.maghribMin / 60 : sunset;
    const isha    = cfg.ishaMin
      ? sunset + cfg.ishaMin / 60
      : iterate(t => angleTime(jd, lat, cfg.isha!, t, "CW"), 18) + offset;

    results.push({
      date:    `${Y}-${String(M).padStart(2,"0")}-${String(D).padStart(2,"0")}`,
      fajr:    toHHMM(fajr),
      sunrise: toHHMM(sunrise),
      dhuhr:   toHHMM(dhuhr),
      asr:     toHHMM(asr),
      maghrib: toHHMM(maghrib),
      isha:    toHHMM(isha),
    });
  }

  return results;
}
