import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  try {
    const supabase = await createSupabaseServerClient();
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : token && type === "email"
        ? await supabase.auth.verifyOtp({ token_hash: token, type: "email" })
        : null;
    if (result && !result.error)
      return NextResponse.redirect(new URL("/", url.origin));
  } catch {
    /* Expired and malformed links get the same safe message. */
  }
  return NextResponse.redirect(
    new URL("/login?error=confirmation", url.origin),
  );
}
