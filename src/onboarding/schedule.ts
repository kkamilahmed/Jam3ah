// Prayer-time logic for the setup guide.
// Start times come from the same calculation the dashboard uses ("Work out prayer times"),
// so a masjid set up here gets exactly the times the dashboard would produce.
import { generateMonthAdhan, mergePresetWithLocation, type PrayerPreset } from "../dashboard/constants";
import { PRAYER_KEYS, iqamaFromRule, ruleOn, type IqamaConfig, type IqamaPeriod, type IqamaRule, type PrayerKey } from "../dashboard/iqama";
import { fmt12, parseISODate, toMinutes } from "../dashboard/time";

// A named group of calculation settings and the months it is used in.
export type WizardPreset = PrayerPreset & { name: string; months: number[] };

export type Location = { latitude: string; longitude: string; timezone: string };

export type StartRow = ReturnType<typeof generateMonthAdhan>[number];

// How the adhan is called relative to the calculated start time.
export type AdhanRule = { mode: "start" } | { mode: "after"; minutes: number } | { mode: "fixed"; time: string };

export interface IqamaSetup {
  adhan: Record<PrayerKey, AdhanRule>;
  iqama: Record<PrayerKey, IqamaRule>;
  // Parts of the year with a different iqama rule (e.g. "June to August: 45 minutes after adhan").
  periods: Record<PrayerKey, IqamaPeriod[]>;
  // Friday khutbah times, "1:30 PM", one per khutbah.
  jummah: string[];
  weekendIsha: { days: string[]; iqama: string };
}

// Per-day changes made in the timetable preview: column -> time (null clears it).
export type DayOverrides = Record<string, Record<string, string | null>>;

export type ScheduleRow = Record<string, string | null> & { date: string };

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const METHOD_HELP: Record<string, string> = {
  NorthAmerica: "Used by most masjids in Canada and the USA.",
  MoonsightingCommittee: "Popular in North America and the UK. Adjusts Fajr and Isha by season.",
  MuslimWorldLeague: "Common in Europe and the Far East.",
};

export const DEFAULT_CALC: Omit<PrayerPreset, "id"> = {
  method: "NorthAmerica",
  fajrAngle: "", ishaAngle: "", ishaInterval: "", maghribAngle: "",
  madhab: "Shafi",
  highLatitudeRule: "recommended",
  polarCircleResolution: "AqrabBalad",
  shafaq: "General",
  rounding: "Nearest",
  adjustFajr: "0", adjustSunrise: "0", adjustDhuhr: "0", adjustAsr: "0", adjustMaghrib: "0", adjustIsha: "0",
};

const GROUP_NAMES = ["Winter", "Summer", "Spring", "Autumn", "Ramadan"];

export function makePresets(count: number): WizardPreset[] {
  return Array.from({ length: count }, (_, i) => ({
    ...DEFAULT_CALC,
    id: String(i),
    name: count === 1 ? "All year" : GROUP_NAMES[i] ?? `Settings ${i + 1}`,
    // With one group there is nothing to choose: it covers every month.
    months: count === 1 ? Array.from({ length: 12 }, (_, m) => m + 1) : [],
  }));
}

// Iqama defaults match the dashboard's: 30 minutes after adhan, 3 minutes for Maghrib.
export function defaultIqamaSetup(): IqamaSetup {
  const adhan = {} as Record<PrayerKey, AdhanRule>;
  const iqama = {} as Record<PrayerKey, IqamaRule>;
  const periods = {} as Record<PrayerKey, IqamaPeriod[]>;
  for (const k of PRAYER_KEYS) {
    adhan[k] = { mode: "start" };
    iqama[k] = { mode: "after", minutes: k === "maghrib" ? 3 : 30 };
    periods[k] = [];
  }
  return { adhan, iqama, periods, jummah: [], weekendIsha: { days: [], iqama: "" } };
}

// The iqama rules in the form saved to prayer_settings.prayer_config (the dashboard reads the same).
export function iqamaConfigOf(setup: IqamaSetup): IqamaConfig {
  return Object.fromEntries(PRAYER_KEYS.map(k => [k, { usual: setup.iqama[k], periods: setup.periods[k] ?? [] }])) as IqamaConfig;
}

export function presetForMonth(presets: WizardPreset[], month: number): PrayerPreset {
  return presets.find(p => p.months.includes(month)) ?? presets[0] ?? { ...DEFAULT_CALC, id: "default" };
}

// Start times for every day of `year`, each month using the settings group it belongs to.
export function calculateYear(presets: WizardPreset[], location: Location, year: number): StartRow[] {
  return Array.from({ length: 12 }, (_, i) =>
    generateMonthAdhan(
      mergePresetWithLocation(presetForMonth(presets, i + 1), location),
      `${year}-${String(i + 1).padStart(2, "0")}`,
    ),
  ).flat();
}

export function adhanMinutes(rule: AdhanRule, startMins: number): number {
  if (rule.mode === "after") return startMins + rule.minutes;
  if (rule.mode === "fixed") return toMinutes(rule.time) ?? startMins;
  return startMins;
}

const WEEKDAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// The rows saved to prayer_times, in the shape the dashboard reads:
// start times (24-hour, as calculated) plus *_adhan and *_iqama, and Jumu'ah on Fridays.
export function buildRows(start: StartRow[], setup: IqamaSetup, overrides: DayOverrides): ScheduleRow[] {
  return start.map(day => {
    const row: ScheduleRow = { date: day.date };
    for (const k of PRAYER_KEYS) {
      row[k] = day[k];
      const s = toMinutes(day[k]);
      if (s === null) continue;
      const rule = setup.adhan[k];
      const a = adhanMinutes(rule, s);
      row[`${k}_adhan`] = rule.mode === "start" ? day[k] : fmt12(a);
      const iqRule = ruleOn({ usual: setup.iqama[k], periods: setup.periods[k] ?? [] }, k, day.date);
      row[`${k}_iqama`] = fmt12(iqamaFromRule(iqRule, a));
    }
    const dow = parseISODate(day.date).getDay();
    if (dow === 5) setup.jummah.forEach((t, i) => { if (t) row[`jummah_${i + 1}`] = t; });
    const wi = setup.weekendIsha;
    if (wi.iqama && wi.days.includes(WEEKDAY_IDS[dow])) row.isha_iqama = wi.iqama;
    return { ...row, ...overrides[day.date], date: day.date };
  });
}

// ── Excel import ─────────────────────────────────────────────────────────
export const EMPTY_COLUMN_MAP: Record<string, string> = {
  date: "", day: "", fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "",
  fajr_iqama: "", dhuhr_iqama: "", asr_iqama: "", maghrib_iqama: "", isha_iqama: "",
  jummah1: "", jummah2: "", jummah3: "",
};

export const HEADER_KEYWORDS = ["fajr", "dhuhr", "zuhr", "asr", "maghrib", "isha", "date", "day"];

// Guesses which spreadsheet column holds which time (same rules as the dashboard).
export function autoMapColumns(headers: string[]): Record<string, string> {
  // Digits are kept so "Jummah 2" is not mistaken for "Jummah 1".
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const isIqamaLike = (h: string) => { const n = norm(h); return n.includes("iqama") || n.includes("jamat"); };
  const find = (kws: string[], excludeIqama = false) => {
    const kwsN = kws.map(norm);
    return headers.find(h => {
      if (excludeIqama && isIqamaLike(h)) return false;
      const hn = norm(h);
      return kwsN.some(k => hn.includes(k));
    }) ?? "";
  };
  return {
    date: find(["date"]),
    day: find(["day", "no."]),
    fajr: find(["fajr begin", "fajr start", "fajr adhan", "fajr azan"]) || find(["fajr"], true),
    dhuhr: find(["dhuhr begin", "zuhr begin", "dhuhr start", "zuhr start"]) || find(["dhuhr", "zuhr"], true),
    asr: find(["asr begin", "asr start"]) || find(["asr"], true),
    maghrib: find(["maghrib begin", "maghrib start", "sunset"]) || find(["maghrib"], true),
    isha: find(["isha begin", "isha start"]) || find(["isha"], true),
    fajr_iqama: find(["fajr iqama", "fajr jamat", "fajr jamaat"]),
    dhuhr_iqama: find(["dhuhr iqama", "zuhr iqama", "dhuhr jamat", "zuhr jamat"]),
    asr_iqama: find(["asr iqama", "asr jamat"]),
    maghrib_iqama: find(["maghrib iqama", "maghrib jamat"]),
    isha_iqama: find(["isha iqama", "isha jamat"]),
    jummah1: find(["jumah 1", "jummah 1", "1st jum"]) || find(["jumah", "jummah"]),
    jummah2: find(["jumah 2", "jummah 2", "2nd jum"]),
    jummah3: find(["jumah 3", "jummah 3", "3rd jum"]),
  };
}

// Reads a date cell: 2026-01-31, 1/31/2026, an Excel serial number or any date text.
export function parseSheetDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(raw)) {
    const p = raw.split(/[/-]/);
    return `${p[2]}-${p[0].padStart(2, "0")}-${p[1].padStart(2, "0")}`;
  }
  // Excel serial dates count days in UTC.
  if (!isNaN(Number(raw)) && Number(raw) > 40000) return new Date(Math.round((Number(raw) - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
