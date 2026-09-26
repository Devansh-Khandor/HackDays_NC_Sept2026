import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { roleForUser, safeNextPath } from "@/lib/auth/policy";
export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const publicRoute =
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/");
  const isApi = pathname.startsWith("/api/");
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const target = new URL("/auth/confirm", request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target);
  }
  let role: "admin" | "student" | null = null;
  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    role = roleForUser(data.user);
  }
  function finish(result: NextResponse) {
    response.cookies.getAll().forEach((c) => result.cookies.set(c));
    result.headers.set("Cache-Control", "private, no-store");
    return result;
  }
  if (!publicRoute && !role) {
    if (isApi)
      return finish(
        NextResponse.json(
          {
            error:
              "Please sign in with a verified @ncsu.edu account to continue.",
          },
          { status: 401 },
        ),
      );
    const target = new URL("/login", request.url);
    target.searchParams.set(
      "next",
      safeNextPath(pathname + request.nextUrl.search),
    );
    return finish(NextResponse.redirect(target));
  }
  if (pathname.startsWith("/admin") && role !== "admin")
    return finish(NextResponse.redirect(new URL("/my-reports", request.url)));
  if (pathname === "/login" && role)
    return finish(
      NextResponse.redirect(
        new URL(role === "admin" ? "/admin" : "/", request.url),
      ),
    );
  return finish(response);
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
