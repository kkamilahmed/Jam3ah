import type { BatchCell, BatchConfig } from "./types";

// ── Time helpers ──────────────────────────────────────────────────────────
export function to12h(timeStr: string): string {
  if (!timeStr || timeStr === "—") return timeStr;
  const m24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let h = parseInt(m24[1]);
    const min = m24[2];
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${min} ${period}`;
  }
  return timeStr;
}

export function formatTimeInput(val: string): string {
  const clean = val.trim();
  if (!clean) return "";
  // Already "h:mm AM/PM"
  const mFull = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (mFull) return `${parseInt(mFull[1])}:${mFull[2].padStart(2, "0")} ${mFull[3].toUpperCase()}`;
  // "h:mmam" or "hhmm am/pm"
  const mAmPm = clean.match(/^(\d{1,2}):?(\d{2})\s*(am|pm)$/i);
  if (mAmPm) {
    let h = parseInt(mAmPm[1]); const m = mAmPm[2]; const p = mAmPm[3].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m} ${h >= 12 ? "PM" : "AM"}`;
  }
  // "h:mm" 24h or ambiguous
  const m24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1]); const m = m24[2];
    const period = h >= 12 ? "PM" : "AM";
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m} ${period}`;
  }
  // Compact "630" or "0630"
  const mCompact = clean.match(/^(\d{3,4})$/);
  if (mCompact) {
    const s = mCompact[1].padStart(4, "0");
    const h = parseInt(s.slice(0, 2)); const m = s.slice(2);
    const period = h >= 12 ? "PM" : "AM";
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m} ${period}`;
  }
  return val;
}

export function addMinsToTime(timeStr: string, mins: number): string {
  if (!timeStr || timeStr === "—") return "–";
  let totalH: number, totalM: number;
  const m24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) { totalH = parseInt(m24[1]); totalM = parseInt(m24[2]); }
  else {
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return timeStr;
    let h = parseInt(match[1]);
    const p = match[3].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    totalH = h; totalM = parseInt(match[2]);
  }
  const total = totalH * 60 + totalM + mins;
  const nh = Math.floor(total / 60) % 24, nm = total % 60;
  const np = nh >= 12 ? "PM" : "AM";
  const dh = nh === 0 ? 12 : nh > 12 ? nh - 12 : nh;
  return `${dh}:${String(nm).padStart(2, "0")} ${np}`;
}

export function makeBatchCell(offset: number): BatchCell { return { mode: "offset", offset, fixed: "" }; }

export function makeDefaultBatchAdhan(): BatchConfig {
  return { fajr: makeBatchCell(0), dhuhr: makeBatchCell(0), asr: makeBatchCell(0), maghrib: makeBatchCell(0), isha: makeBatchCell(0) };
}

export function makeDefaultBatchIqama(): BatchConfig {
  return { fajr: makeBatchCell(30), dhuhr: makeBatchCell(30), asr: makeBatchCell(30), maghrib: makeBatchCell(3), isha: makeBatchCell(30) };
}

export function applyBatchCell(cell: BatchCell, base: string): string {
  if (!base || base === "—") return "—";
  if (cell.mode === "fixed" && cell.fixed) return formatTimeInput(cell.fixed);
  return addMinsToTime(base, cell.offset);
}

export function addDefaultAdhanIqama(row: { date: string; fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
    const start = row[p] ?? "";
    const adhan = start; // 0 min offset
    out[`${p}_adhan`] = adhan;
    out[`${p}_iqama`] = addMinsToTime(adhan, p === "maghrib" ? 3 : 30);
  }
  return out;
}
