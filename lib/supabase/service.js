import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the Service Role key. Bypasses RLS. Never import this in client components.
export function getSupabaseServiceRoleClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: { persistSession: false },
        }
    );
}
