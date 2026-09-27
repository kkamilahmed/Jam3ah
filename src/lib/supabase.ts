import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SERVICE = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Standard client — used for login, reading masjid data
export const supabase = createClient(URL, ANON);

// Admin client — used ONLY in AdminPage to create auth users on approval
// In production this should live in a server-side Edge Function
export const supabaseAdmin = createClient(URL, SERVICE, {
  // Its own storage key so it does not clash with the normal client's session.
  auth: { autoRefreshToken: false, persistSession: false, storageKey: "jam3ah-admin" },
});
