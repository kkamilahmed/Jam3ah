// Iqama rules: how a masjid decides its iqama time for each prayer.
// Stored per masjid in prayer_settings.prayer_config and applied to prayer_times rows.
import type { PrayerTime } from "./types";
import { fmt12, toMinutes } from "./time";

export const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export type IqamaRule =
  | { mode: "after"; minutes: number }
  | { mode: "fixed"; time: string };

export type IqamaRules = Partial<Record<PrayerKey, IqamaRule>>;

type Row = PrayerTime & Record<string, string | undefined>;

export function adhanOf(row: PrayerTime | undefined, key: PrayerKey): string | undefined {
  if (!row) return undefined;
  const r = row as Row;
  return r[`${key}_adhan`] || r[key] || undefined;
}

export function iqamaOf(row: PrayerTime | undefined, key: PrayerKey): string | undefined {
  if (!row) return undefined;
  return (row as Row)[`${key}_iqama`] || undefined;
}

export function iqamaFromRule(rule: IqamaRule, adhanMins: number): number {
  if (rule.mode === "after") return adhanMins + rule.minutes;
  return toMinutes(rule.time) ?? adhanMins;
}

export function describeRule(rule: IqamaRule | null): string {
  if (!rule) return "Set day by day";
  if (rule.mode === "after") return rule.minutes === 0 ? "Straight after adhan" : `${rule.minutes} minutes after adhan`;
  return `Always at ${rule.time}`;
}

function pairsFor(rows: PrayerTime[], key: PrayerKey) {
  return rows
    .map(r => ({ date: r.date, a: toMinutes(adhanOf(r, key)), i: toMinutes(iqamaOf(r, key)) }))
    .filter((p): p is { date: string; a: number; i: number } => p.a !== null && p.i !== null);
}

function mostCommon(values: number[]): { value: number; count: number } {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = { value: values[0], count: 0 };
  for (const [value, count] of counts) if (count > best.count) best = { value, count };
  return best;
}

// Reads inside a sentence: "Asr iqama will be 15 minutes after adhan" / "... will be at 5:00 PM".
export function ruleSentence(rule: IqamaRule): string {
  if (rule.mode === "after") return rule.minutes === 0 ? "straight after adhan" : `${rule.minutes} minutes after adhan`;
  return `at ${rule.time}`;
}

// Works out the rule a masjid is following from a run of days, by majority, so a
// one-off day (such as a weekend Isha override) doesn't hide the everyday rule.
export function inferRule(rows: PrayerTime[], key: PrayerKey): IqamaRule | null {
  const pairs = pairsFor(rows, key);
  if (pairs.length === 0) return null;
  const gap = mostCommon(pairs.map(p => p.i - p.a));
  const fixed = mostCommon(pairs.map(p => p.i));
  const needed = Math.ceil(pairs.length / 2);
  const gapOk = gap.count >= needed && gap.value >= 0 && gap.value <= 180;
  const fixedOk = fixed.count >= needed;
  // When adhan hardly moves (e.g. Dhuhr in November) both readings fit equally well.
  // People choose round numbers, so "1:30 PM" beats "88 minutes after adhan", and "30 minutes after" beats "4:58 PM".
  let preferAfter = gap.count > fixed.count;
  if (gap.count === fixed.count) preferAfter = gap.value % 5 === 0 || fixed.value % 5 !== 0;
  if (gapOk && (preferAfter || !fixedOk)) return { mode: "after", minutes: gap.value };
  if (fixedOk) return { mode: "fixed", time: fmt12(fixed.value) };
  return null;
}

export function ruleMatches(rule: IqamaRule, row: PrayerTime, key: PrayerKey): boolean {
  const a = toMinutes(adhanOf(row, key));
  const i = toMinutes(iqamaOf(row, key));
  return a !== null && i !== null && iqamaFromRule(rule, a) === i;
}

export function sameRule(a: IqamaRule | null | undefined, b: IqamaRule | null | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.mode !== b.mode) return false;
  return a.mode === "after" ? a.minutes === (b as { minutes: number }).minutes : a.time === (b as { time: string }).time;
}

// ── Seasonal iqama ───────────────────────────────────────────────────────
// Each prayer has a usual rule plus optional periods with a different rule, for example
// "June to August: 45 minutes after adhan" (repeats every year) or exact dates for Ramadan.

export type IqamaPeriod =
  | { id: string; kind: "months"; fromMonth: number; toMonth: number; rule: IqamaRule }
  | { id: string; kind: "dates"; from: string; to: string; rule: IqamaRule };

export type PrayerIqama = { usual: IqamaRule; periods: IqamaPeriod[] };
export type IqamaConfig = Partial<Record<PrayerKey, PrayerIqama>>;

export const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function defaultRule(key: PrayerKey): IqamaRule {
  return { mode: "after", minutes: key === "maghrib" ? 3 : 30 };
}

const isRule = (v: unknown): v is IqamaRule =>
  !!v && typeof v === "object" && ((v as IqamaRule).mode === "after" || (v as IqamaRule).mode === "fixed");

// prayer_config used to hold one rule per prayer; newer saves hold { usual, periods }.
export function normalizeConfig(raw: unknown): IqamaConfig {
  const out: IqamaConfig = {};
  if (!raw || typeof raw !== "object") return out;
  for (const k of PRAYER_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (isRule(v)) out[k] = { usual: v, periods: [] };
    else if (v && typeof v === "object" && isRule((v as PrayerIqama).usual)) {
      const periods = Array.isArray((v as PrayerIqama).periods) ? (v as PrayerIqama).periods.filter(p => p && isRule(p.rule)) : [];
      out[k] = { usual: (v as PrayerIqama).usual, periods };
    }
  }
  return out;
}

export function periodCovers(p: IqamaPeriod, iso: string): boolean {
  if (p.kind === "dates") return iso >= p.from && iso <= p.to;
  const m = Number(iso.slice(5, 7));
  return p.fromMonth <= p.toMonth ? m >= p.fromMonth && m <= p.toMonth : m >= p.fromMonth || m <= p.toMonth;
}

// Rough length in days, used so the more specific period wins when two overlap.
function periodLength(p: IqamaPeriod): number {
  if (p.kind === "dates") return (Date.parse(p.to) - Date.parse(p.from)) / 86_400_000 + 1;
  return (((p.toMonth - p.fromMonth + 12) % 12) + 1) * 31;
}

// Exact dates win over month ranges; otherwise the shorter period wins.
const byPriority = (a: IqamaPeriod, b: IqamaPeriod) =>
  a.kind === b.kind ? periodLength(a) - periodLength(b) : a.kind === "dates" ? -1 : 1;

export function periodWinner(a: IqamaPeriod, b: IqamaPeriod): IqamaPeriod {
  return byPriority(a, b) <= 0 ? a : b;
}

export function activePeriod(cfg: PrayerIqama | undefined, iso: string): IqamaPeriod | null {
  const hits = (cfg?.periods ?? []).filter(p => periodCovers(p, iso));
  if (hits.length === 0) return null;
  return hits.sort(byPriority)[0];
}

export function ruleOn(cfg: PrayerIqama | undefined, key: PrayerKey, iso: string): IqamaRule {
  return activePeriod(cfg, iso)?.rule ?? cfg?.usual ?? defaultRule(key);
}

export function describePeriod(p: IqamaPeriod): string {
  if (p.kind === "months") {
    if (p.fromMonth === p.toMonth) return MONTH_LONG[p.fromMonth - 1];
    return `${MONTH_LONG[p.fromMonth - 1]} to ${MONTH_LONG[p.toMonth - 1]}`;
  }
  const f = new Date(p.from + "T12:00:00");
  const t = new Date(p.to + "T12:00:00");
  const day = (d: Date, withYear: boolean) => d.toLocaleDateString("en-US", { day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) });
  if (p.from === p.to) return day(f, true);
  if (f.getFullYear() === t.getFullYear() && f.getMonth() === t.getMonth()) {
    return `${day(f, false)} to ${t.getDate()}, ${t.getFullYear()}`;
  }
  return `${day(f, f.getFullYear() !== t.getFullYear())} to ${day(t, true)}`;
}

// Pairs of periods that cover some of the same days, so the page can say which one wins.
export function overlappingPeriods(periods: IqamaPeriod[]): [IqamaPeriod, IqamaPeriod][] {
  const out: [IqamaPeriod, IqamaPeriod][] = [];
  // Checking every day of a leap year covers all month ranges; exact dates are checked on their own days.
  const sampleDays = (p: IqamaPeriod, q: IqamaPeriod) => {
    const days: string[] = [];
    for (const r of [p, q]) {
      if (r.kind === "dates") {
        for (let t = Date.parse(r.from + "T12:00:00"); t <= Date.parse(r.to + "T12:00:00"); t += 86_400_000) {
          const d = new Date(t);
          days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
        }
      }
    }
    if (days.length === 0) for (let m = 1; m <= 12; m++) days.push(`2028-${String(m).padStart(2, "0")}-15`);
    return days;
  };
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const [p, q] = [periods[i], periods[j]];
      if (sampleDays(p, q).some(d => periodCovers(p, d) && periodCovers(q, d))) out.push([p, q]);
    }
  }
  return out;
}
