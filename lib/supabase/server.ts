import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";
import { AppError } from "@/lib/server/errors";
export async function createSupabaseServerClient() {
  const config = supabaseConfig();
  if (!config)
    throw new AppError(
      "CampusFix sign-in is being configured. Please try again once the Supabase connection is ready.",
      503,
    );
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server components read refreshed cookies from proxy; only routes may write them. */
        }
      },
    },
  });
}
