import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  credentialsSchema,
  roleForUser,
  safeNextPath,
} from "@/lib/auth/policy";
import { apiError, AppError, readJson } from "@/lib/server/errors";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { action } = await params;
    if (!["login", "signup", "logout"].includes(action))
      throw new AppError("Unknown authentication action.", 404);
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
    if (origin && new URL(origin).host !== host)
      throw new AppError("This request is not allowed.", 403);
    const supabase = await createSupabaseServerClient();
    if (action === "logout") {
      const { error } = await supabase.auth.signOut();
      if (error)
        throw new AppError("Unable to sign out. Please try again.", 502);
      return NextResponse.json({ redirect: "/login" });
    }
    const body = await readJson(request);
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success)
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Check your email and password.",
      );
    const { email, password } = parsed.data;
    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin ?? new URL(request.url).origin}/auth/confirm`,
        },
      });
      if (error)
        throw new AppError(
          error.status === 429
            ? "Too many signup attempts. Please wait before trying again."
            : error.code === "email_address_not_authorized"
              ? "Email delivery is not configured for this campus address yet. Contact the CampusFix administrator."
              : "We could not create the account. Try again or sign in if you already have an account.",
          error.status === 429 ? 429 : 400,
        );
      // This project must keep email confirmation enabled.
      if (data.session) {
        await supabase.auth.signOut();
        throw new AppError(
          "Email confirmation must be enabled for this campus project. Contact the administrator.",
          503,
        );
      }
      return NextResponse.json({
        message:
          "Check your NC State email to confirm your account, then sign in.",
      });
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      throw new AppError(
        error.code === "email_not_confirmed"
          ? "Confirm your email using the link in your inbox before signing in."
          : error.status === 429
            ? "Too many attempts. Please wait and try again."
            : "The email or password is incorrect.",
        error.status === 429 ? 429 : 401,
      );
    const role = roleForUser(data.user);
    if (!role) {
      await supabase.auth.signOut();
      throw new AppError("A verified @ncsu.edu email is required.", 403);
    }
    const next = typeof body.next === "string" ? body.next : null;
    return NextResponse.json({
      redirect:
        role === "admin"
          ? "/admin"
          : safeNextPath(next?.startsWith("/admin") ? null : next, "/"),
    });
  } catch (error) {
    return apiError(error);
  }
}
