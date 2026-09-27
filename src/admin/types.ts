export interface Registration {
  id: string;
  masjid_name: string;
  address: string;
  masjid_phone: string;
  masjid_email: string;
  incharge_name: string;
  incharge_phone: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface Masjid {
  id: string;
  user_id: string;
  masjid_name: string;
  address: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  masjid_email: string;
  masjid_phone: string;
  incharge_name: string;
  incharge_phone?: string;
  status: "active" | "suspended";
  theme?: string;
  subdomain?: string;
  website_enabled?: boolean;
  onboarding_complete?: boolean;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  whatsapp?: string;
  website_url?: string;
  created_at: string;
  latitude?: string;
  longitude?: string;
}

export type AdminTab = "overview" | "pending" | "masjids";

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
