// Date and time helpers for the dashboard.
// Dates are always the masjid admin's local calendar day, never UTC: `toISOString()`
// rolls over to tomorrow in the evening across the Americas.

export function localISODate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return localISODate(d);
}

export function parseISODate(iso: string): Date {
  return new Date(iso + "T12:00:00");
}

// Minutes since midnight from "05:42", "05:42:00", "5:42 AM" or "5:42PM". Null when unreadable.
export function toMinutes(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 23) return null;
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

export function fmt12(mins: number): string {
  const t = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// Reads what a person types: "1:30 pm", "130pm", "1:30PM", "5pm", "5 p.m.", "13:30", "1330".
// A bare hour like "5" is refused: it could mean 5 AM or 5 PM.
export function parseTypedTime(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/);
  if (!m) return null;
  if (m[2] === undefined && !m[3]) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (min > 59 || h > 23) return null;
  const ap = m[3]?.[0];
  if (ap && (h === 0 || h > 12)) return null;
  if (ap === "p" && h < 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  return h * 60 + min;
}

export function displayTime(raw: string | null | undefined): string {
  const m = toMinutes(raw);
  return m === null ? (raw || "-") : fmt12(m);
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatHijri(d: Date): string {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(d);
  } catch {
    return "";
  }
}

export function formatCountdown(mins: number): string {
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} hour${h === 1 ? "" : "s"}`;
}
