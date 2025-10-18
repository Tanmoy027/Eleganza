import { createBrowserClient } from "@supabase/ssr";

// Global client instance to reuse connection
let supabaseClient = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      // Add connection options for better performance
      db: {
        schema: 'public'
      },
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      // Add realtime options to reduce connection issues
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    }
  );

  // Add error handling for connection issues
  if (typeof window !== 'undefined') {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      // Handle auth state changes to prevent stale sessions
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        window.localStorage.removeItem('supabase.auth.token');
        window.sessionStorage.clear();
      }
    });
  }

  return supabaseClient;
}

// Alias for consistency
export const getSupabaseBrowserClient = getSupabaseClient;
