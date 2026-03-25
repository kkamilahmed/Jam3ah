import {
  PrayerTimes, Coordinates, CalculationMethod,
  Madhab, HighLatitudeRule, PolarCircleResolution, Shafaq, Rounding,
} from "adhan";

// ── Calculation methods ───────────────────────────────────────────────────
export const CALC_METHODS = [
  { value: "NorthAmerica",          label: "Islamic Society of North America (ISNA)" },
  { value: "MuslimWorldLeague",     label: "Muslim World League" },
  { value: "Egyptian",              label: "Egyptian General Authority of Survey" },
  { value: "UmmAlQura",             label: "Umm Al-Qura University, Makkah" },
  { value: "Karachi",               label: "University of Islamic Sciences, Karachi" },
  { value: "Tehran",                label: "Institute of Geophysics, Tehran" },
  { value: "MoonsightingCommittee", label: "Moonsighting Committee Worldwide" },
  { value: "Dubai",                 label: "Dubai" },
  { value: "Qatar",                 label: "Qatar" },
  { value: "Kuwait",                label: "Kuwait" },
  { value: "Singapore",             label: "Majlis Ugama Islam Singapura" },
  { value: "Turkey",                label: "Diyanet İşleri Başkanlığı, Turkey" },
  { value: "Other",                 label: "Other / Custom" },
];

export const TIMEZONES: { value: string; label: string }[] = [
  // North America
  { value: "America/Toronto",               label: "Eastern Time — Toronto" },
  { value: "America/New_York",              label: "Eastern Time — New York" },
  { value: "America/Chicago",               label: "Central Time — Chicago" },
  { value: "America/Winnipeg",              label: "Central Time — Winnipeg" },
  { value: "America/Denver",               label: "Mountain Time — Denver" },
  { value: "America/Edmonton",              label: "Mountain Time — Edmonton" },
  { value: "America/Phoenix",               label: "Mountain Time — Phoenix (no DST)" },
  { value: "America/Los_Angeles",           label: "Pacific Time — Los Angeles" },
  { value: "America/Vancouver",             label: "Pacific Time — Vancouver" },
  { value: "America/Halifax",               label: "Atlantic Time — Halifax" },
  { value: "America/St_Johns",              label: "Newfoundland Time — St. John's" },
  // South & Central America
  { value: "America/Sao_Paulo",             label: "Brasília Time — São Paulo" },
  { value: "America/Argentina/Buenos_Aires",label: "Argentina Time — Buenos Aires" },
  { value: "America/Bogota",                label: "Colombia Time — Bogotá" },
  // Europe
  { value: "Europe/London",                 label: "GMT / BST — London" },
  { value: "Europe/Dublin",                 label: "GMT / IST — Dublin" },
  { value: "Europe/Lisbon",                 label: "Western European Time — Lisbon" },
  { value: "Europe/Paris",                  label: "Central European Time — Paris" },
  { value: "Europe/Berlin",                 label: "Central European Time — Berlin" },
  { value: "Europe/Amsterdam",              label: "Central European Time — Amsterdam" },
  { value: "Europe/Brussels",               label: "Central European Time — Brussels" },
  { value: "Europe/Rome",                   label: "Central European Time — Rome" },
  { value: "Europe/Madrid",                 label: "Central European Time — Madrid" },
  { value: "Europe/Stockholm",              label: "Central European Time — Stockholm" },
  { value: "Europe/Oslo",                   label: "Central European Time — Oslo" },
  { value: "Europe/Warsaw",                 label: "Central European Time — Warsaw" },
  { value: "Europe/Athens",                 label: "Eastern European Time — Athens" },
  { value: "Europe/Istanbul",               label: "Turkey Time — Istanbul" },
  { value: "Europe/Moscow",                 label: "Moscow Time — Moscow" },
  // Africa
  { value: "Africa/Casablanca",             label: "Western European Time — Casablanca" },
  { value: "Africa/Algiers",                label: "Central European Time — Algiers" },
  { value: "Africa/Tunis",                  label: "Central European Time — Tunis" },
  { value: "Africa/Tripoli",                label: "Eastern European Time — Tripoli" },
  { value: "Africa/Cairo",                  label: "Eastern European Time — Cairo" },
  { value: "Africa/Khartoum",              label: "Central Africa Time — Khartoum" },
  { value: "Africa/Addis_Ababa",            label: "East Africa Time — Addis Ababa" },
  { value: "Africa/Nairobi",                label: "East Africa Time — Nairobi" },
  { value: "Africa/Lagos",                  label: "West Africa Time — Lagos" },
  { value: "Africa/Accra",                  label: "GMT — Accra" },
  { value: "Africa/Johannesburg",           label: "South Africa Time — Johannesburg" },
  // Middle East
  { value: "Asia/Tehran",                   label: "Iran Time — Tehran" },
  { value: "Asia/Aden",                     label: "Arabia Time — Aden" },
  { value: "Asia/Riyadh",                   label: "Arabia Time — Riyadh" },
  { value: "Asia/Kuwait",                   label: "Arabia Time — Kuwait" },
  { value: "Asia/Qatar",                    label: "Arabia Time — Doha" },
  { value: "Asia/Bahrain",                  label: "Arabia Time — Manama" },
  { value: "Asia/Dubai",                    label: "Gulf Time — Dubai" },
  { value: "Asia/Muscat",                   label: "Gulf Time — Muscat" },
  { value: "Asia/Baghdad",                  label: "Arabia Time — Baghdad" },
  { value: "Asia/Amman",                    label: "Arabia Time — Amman" },
  { value: "Asia/Beirut",                   label: "Eastern European Time — Beirut" },
  { value: "Asia/Damascus",                 label: "Eastern European Time — Damascus" },
  { value: "Asia/Jerusalem",                label: "Israel Time — Jerusalem" },
  // South & Central Asia
  { value: "Asia/Kabul",                    label: "Afghanistan Time — Kabul" },
  { value: "Asia/Karachi",                  label: "Pakistan Time — Karachi" },
  { value: "Asia/Tashkent",                 label: "Uzbekistan Time — Tashkent" },
  { value: "Asia/Almaty",                   label: "Kazakhstan Time — Almaty" },
  { value: "Asia/Kolkata",                  label: "India Time — Mumbai / Delhi" },
  { value: "Asia/Dhaka",                    label: "Bangladesh Time — Dhaka" },
  { value: "Asia/Colombo",                  label: "Sri Lanka Time — Colombo" },
  // Southeast & East Asia
  { value: "Asia/Yangon",                   label: "Myanmar Time — Yangon" },
  { value: "Asia/Bangkok",                  label: "Indochina Time — Bangkok" },
  { value: "Asia/Jakarta",                  label: "Western Indonesia Time — Jakarta" },
  { value: "Asia/Kuala_Lumpur",             label: "Malaysia Time — Kuala Lumpur" },
  { value: "Asia/Singapore",                label: "Singapore Time — Singapore" },
  { value: "Asia/Manila",                   label: "Philippines Time — Manila" },
  { value: "Asia/Shanghai",                 label: "China Time — Beijing / Shanghai" },
  { value: "Asia/Tokyo",                    label: "Japan Time — Tokyo" },
  // Oceania
  { value: "Australia/Perth",               label: "Australian Western Time — Perth" },
  { value: "Australia/Adelaide",            label: "Australian Central Time — Adelaide" },
  { value: "Australia/Sydney",              label: "Australian Eastern Time — Sydney" },
  { value: "Pacific/Auckland",              label: "New Zealand Time — Auckland" },
];

export const MADHABS = [
  { value: "Shafi",  label: "Standard (Shafi'i / Maliki / Hanbali)" },
  { value: "Hanafi", label: "Hanafi" },
];

export const HIGH_LATITUDE_RULES = [
  { value: "recommended",      label: "Recommended (auto-detect)" },
  { value: "TwilightAngle",    label: "Twilight Angle" },
  { value: "MiddleOfTheNight", label: "Middle of the Night" },
  { value: "SeventhOfTheNight", label: "Seventh of the Night" },
];

export const POLAR_CIRCLE_RESOLUTIONS = [
  { value: "AqrabBalad", label: "Aqrab Balad (nearest city)" },
  { value: "AqrabYaum",  label: "Aqrab Yaum (nearest day)" },
  { value: "Unresolved", label: "Unresolved" },
];

export const SHAFAQ_OPTIONS = [
  { value: "General", label: "General (default)" },
  { value: "Ahmer",   label: "Ahmer (red twilight)" },
  { value: "Abyad",   label: "Abyad (white twilight)" },
];

// ── Angles baked into each preset method ─────────────────────────────────
// fajr/isha = degrees below horizon; ishaInterval = minutes after Maghrib
// (null = not used by that method)
export const METHOD_ANGLES: Record<string, { fajr: number | null; isha: number | null; ishaInterval: number | null; maghrib: number | null }> = {
  NorthAmerica:          { fajr: 15,   isha: 15,   ishaInterval: null, maghrib: null },
  MuslimWorldLeague:     { fajr: 18,   isha: 17,   ishaInterval: null, maghrib: null },
  Egyptian:              { fajr: 19.5, isha: 17.5, ishaInterval: null, maghrib: null },
  UmmAlQura:             { fajr: 18.5, isha: null,  ishaInterval: 90,   maghrib: null },
  Karachi:               { fajr: 18,   isha: 18,   ishaInterval: null, maghrib: null },
  Tehran:                { fajr: 17.7, isha: 14,   ishaInterval: null, maghrib: 4.5  },
  MoonsightingCommittee: { fajr: 18,   isha: 18,   ishaInterval: null, maghrib: null },
  Dubai:                 { fajr: 18.2, isha: 18.2, ishaInterval: null, maghrib: null },
  Qatar:                 { fajr: 18,   isha: null,  ishaInterval: 90,   maghrib: null },
  Kuwait:                { fajr: 18,   isha: 17.5, ishaInterval: null, maghrib: null },
  Singapore:             { fajr: 20,   isha: 18,   ishaInterval: null, maghrib: null },
  Turkey:                { fajr: 18,   isha: 17,   ishaInterval: null, maghrib: null },
  Other:                 { fajr: null,  isha: null,  ishaInterval: null, maghrib: null },
};

export const ROUNDING_OPTIONS = [
  { value: "Nearest", label: "Round to nearest minute" },
  { value: "Up",      label: "Always round up" },
  { value: "None",    label: "No rounding (exact)" },
];

// ── Prayer settings type ──────────────────────────────────────────────────
export type PrayerSettingsAdhan = {
  // Location
  latitude: string;
  longitude: string;
  timezone: string;
  // Method
  method: string;
  fajrAngle: string;        // used when method === "Other"
  ishaAngle: string;        // used when method === "Other"
  ishaInterval: string;     // minutes after Maghrib — used when method === "Other"
  maghribAngle: string;     // used when method === "Other"
  // Juristic
  madhab: string;
  // High latitude
  highLatitudeRule: string;
  polarCircleResolution: string;
  // Moonsighting
  shafaq: string;
  // Output
  rounding: string;
  // Per-prayer minute adjustments
  adjustFajr: string;
  adjustSunrise: string;
  adjustDhuhr: string;
  adjustAsr: string;
  adjustMaghrib: string;
  adjustIsha: string;
};

// ── Named preset — full calculation config (inherits only location + timezone) ──
export type PrayerPreset = {
  id: string;
  // Method
  method: string;
  fajrAngle: string;
  ishaAngle: string;
  ishaInterval: string;
  maghribAngle: string;
  // Juristic
  madhab: string;
  // Edge cases
  highLatitudeRule: string;
  polarCircleResolution: string;
  shafaq: string;
  // Output
  rounding: string;
  adjustFajr: string;
  adjustSunrise: string;
  adjustDhuhr: string;
  adjustAsr: string;
  adjustMaghrib: string;
  adjustIsha: string;
};

// month (1–12) → preset id  (empty string = unassigned)
export type MonthPresetMap = Record<number, string>;

// ── Shared type for generated rows ───────────────────────────────────────
type DayRow = { date: string; fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string };

// ── Build adhan-js CalculationParameters from PrayerSettingsAdhan ─────────
function buildAdhanParams(ps: PrayerSettingsAdhan, coords: Coordinates) {
  const methodMap: Record<string, () => ReturnType<typeof CalculationMethod.NorthAmerica>> = {
    NorthAmerica:          () => CalculationMethod.NorthAmerica(),
    MuslimWorldLeague:     () => CalculationMethod.MuslimWorldLeague(),
    Egyptian:              () => CalculationMethod.Egyptian(),
    UmmAlQura:             () => CalculationMethod.UmmAlQura(),
    Karachi:               () => CalculationMethod.Karachi(),
    Tehran:                () => CalculationMethod.Tehran(),
    MoonsightingCommittee: () => CalculationMethod.MoonsightingCommittee(),
    Dubai:                 () => CalculationMethod.Dubai(),
    Qatar:                 () => CalculationMethod.Qatar(),
    Kuwait:                () => CalculationMethod.Kuwait(),
    Singapore:             () => CalculationMethod.Singapore(),
    Turkey:                () => CalculationMethod.Turkey(),
    Other:                 () => CalculationMethod.Other(),
  };
  const params = (methodMap[ps.method] ?? methodMap.Other)();

  if (ps.method === "Other") {
    const fa = parseFloat(ps.fajrAngle);
    const ia = parseFloat(ps.ishaAngle);
    const ii = parseFloat(ps.ishaInterval);
    const ma = parseFloat(ps.maghribAngle);
    if (!isNaN(fa)) params.fajrAngle = fa;
    if (!isNaN(ia)) params.ishaAngle = ia;
    if (!isNaN(ii)) params.ishaInterval = ii;
    if (!isNaN(ma)) params.maghribAngle = ma;
  }

  params.madhab = ps.madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;

  if (ps.highLatitudeRule === "recommended") {
    params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  } else if (ps.highLatitudeRule === "MiddleOfTheNight") {
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  } else if (ps.highLatitudeRule === "SeventhOfTheNight") {
    params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  } else {
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  }

  if (ps.polarCircleResolution === "AqrabYaum") {
    params.polarCircleResolution = PolarCircleResolution.AqrabYaum;
  } else if (ps.polarCircleResolution === "Unresolved") {
    params.polarCircleResolution = PolarCircleResolution.Unresolved;
  } else {
    params.polarCircleResolution = PolarCircleResolution.AqrabBalad;
  }

  if (ps.shafaq === "Ahmer") {
    params.shafaq = Shafaq.Ahmer;
  } else if (ps.shafaq === "Abyad") {
    params.shafaq = Shafaq.Abyad;
  } else {
    params.shafaq = Shafaq.General;
  }

  if (ps.rounding === "Up") {
    params.rounding = Rounding.Up;
  } else if (ps.rounding === "None") {
    params.rounding = Rounding.None;
  } else {
    params.rounding = Rounding.Nearest;
  }

  const adj = (v: string) => parseFloat(v) || 0;
  params.adjustments = {
    fajr:    adj(ps.adjustFajr),
    sunrise: adj(ps.adjustSunrise),
    dhuhr:   adj(ps.adjustDhuhr),
    asr:     adj(ps.adjustAsr),
    maghrib: adj(ps.adjustMaghrib),
    isha:    adj(ps.adjustIsha),
  };

  return params;
}

function makeFormatter(timezone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });
  return (d: Date) => {
    const parts = fmt.formatToParts(d);
    return `${parts.find(p => p.type === "hour")!.value}:${parts.find(p => p.type === "minute")!.value}`;
  };
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y: number, m: number) =>
  [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];

function computeDay(coords: Coordinates, params: ReturnType<typeof buildAdhanParams>, fmt: (d: Date) => string, y: number, m: number, d: number): DayRow {
  const pt = new PrayerTimes(coords, new Date(y, m, d), params);
  return {
    date:    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    fajr:    fmt(pt.fajr),
    sunrise: fmt(pt.sunrise),
    dhuhr:   fmt(pt.dhuhr),
    asr:     fmt(pt.asr),
    maghrib: fmt(pt.maghrib),
    isha:    fmt(pt.isha),
  };
}

// ── Generate a full year ──────────────────────────────────────────────────
export function generateYearAdhan(ps: PrayerSettingsAdhan, year: number): DayRow[] {
  const coords = new Coordinates(parseFloat(ps.latitude), parseFloat(ps.longitude));
  const params = buildAdhanParams(ps, coords);
  const fmt = makeFormatter(ps.timezone);
  const results: DayRow[] = [];
  for (let month = 0; month < 12; month++)
    for (let day = 1; day <= daysInMonth(year, month); day++)
      results.push(computeDay(coords, params, fmt, year, month, day));
  return results;
}

// ── Generate a month range (fromMonth/toMonth are "YYYY-MM") ─────────────
export function generateRangeAdhan(ps: PrayerSettingsAdhan, fromMonth: string, toMonth: string): DayRow[] {
  const coords = new Coordinates(parseFloat(ps.latitude), parseFloat(ps.longitude));
  const params = buildAdhanParams(ps, coords);
  const fmt = makeFormatter(ps.timezone);
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  const results: DayRow[] = [];
  let y = fy, m = fm - 1;
  const endM = tm - 1;
  while (y < ty || (y === ty && m <= endM)) {
    for (let d = 1; d <= daysInMonth(y, m); d++)
      results.push(computeDay(coords, params, fmt, y, m, d));
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return results;
}

// ── Generate a single month (monthKey = "YYYY-MM") ───────────────────────
export function generateMonthAdhan(ps: PrayerSettingsAdhan, monthKey: string): DayRow[] {
  const [y, m] = monthKey.split("-").map(Number);
  const coords = new Coordinates(parseFloat(ps.latitude), parseFloat(ps.longitude));
  const params = buildAdhanParams(ps, coords);
  const fmt = makeFormatter(ps.timezone);
  const results: DayRow[] = [];
  for (let d = 1; d <= daysInMonth(y, m - 1); d++)
    results.push(computeDay(coords, params, fmt, y, m - 1, d));
  return results;
}

// ── Merge a PrayerPreset with location/timezone into PrayerSettingsAdhan ──
export function mergePresetWithLocation(
  preset: PrayerPreset,
  location: { latitude: string; longitude: string; timezone: string }
): PrayerSettingsAdhan {
  return { ...location, ...preset };
}

// ── Shared CSS class strings ──────────────────────────────────────────────
export const inputClsBase = `w-full px-4 py-3 bg-zinc-900 border-2 border-white/10 rounded-xl text-white font-medium outline-none focus:outline-none focus:ring-0 hover:border-white/20 placeholder-zinc-600 transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;
export const selectClsBase = `w-full px-4 py-3 bg-zinc-900 border-2 border-white/10 rounded-xl text-white font-medium outline-none focus:outline-none focus:ring-0 hover:border-white/20 transition-all cursor-pointer appearance-none [&>option]:bg-zinc-900 [&>option]:text-white`;
export const labelCls = `block text-xs text-zinc-500 font-black uppercase tracking-widest mb-2`;

export function makeInputCls(inputFocus: string) {
  return `${inputClsBase} ${inputFocus}`;
}
export function makeSelectCls(inputFocus: string) {
  return `${selectClsBase} ${inputFocus}`;
}
