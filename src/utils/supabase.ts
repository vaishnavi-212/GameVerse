import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Supabase now issues publishable keys; legacy anon keys are also supported.
const supabasePublicKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export const supabase: SupabaseClient | null =
  supabaseUrl && supabasePublicKey ? createClient(supabaseUrl, supabasePublicKey) : null;

export const isCloudTrackingConfigured = Boolean(supabase);
