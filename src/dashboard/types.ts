// ── Types ─────────────────────────────────────────────────────────────────
export interface PrayerTime {
  date: string; fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string;
  fajr_adhan?: string; fajr_iqama?: string;
  dhuhr_adhan?: string; dhuhr_iqama?: string;
  asr_adhan?: string; asr_iqama?: string;
  maghrib_adhan?: string; maghrib_iqama?: string; maghrib_iqama_2?: string; maghrib_iqama_3?: string;
  isha_adhan?: string; isha_iqama?: string;
  fajr_iqama_2?: string; fajr_iqama_3?: string;
  jummah_1?: string; jummah_2?: string; jummah_3?: string;
}
export interface Event { id: string; title: string; description: string; date: string; time: string; endTime?: string; category: string; }
export interface EventForm { title: string; description: string; date: string; time: string; endTime: string; category: string; }
export interface Announcement { id: string; title: string; body: string; createdAt: string; expiresAt: string; }
export interface NotificationForm { type: string; title: string; message: string; }
export interface Question { id: number; name: string; email: string; question: string; date: string; answered: boolean; answer?: string; }
export interface Month { value: string; label: string; }
export interface BatchCell { mode: "offset" | "fixed"; offset: number; fixed: string; }
export interface BatchCell2 extends BatchCell { enabled: boolean; }
export interface BatchConfig { fajr: BatchCell; dhuhr: BatchCell; asr: BatchCell; maghrib: BatchCell; isha: BatchCell; }
