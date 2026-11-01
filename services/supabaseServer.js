import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for Route Handlers and Server Components.
// Create a new one per request; never share it between requests.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies; proxy.js refreshes the session instead.
          }
        },
      },
    }
  );
}
