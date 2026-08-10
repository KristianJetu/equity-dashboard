import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Vždy přístupné bez autentizace
  if (pathname.startsWith("/api/inbound-email")) return NextResponse.next();
  if (pathname.startsWith("/api/parse-email")) return NextResponse.next();
  if (pathname.startsWith("/login")) return NextResponse.next();
  if (pathname.startsWith("/onboarding")) return NextResponse.next();
  if (pathname.startsWith("/set-password")) return NextResponse.next();
  if (pathname.startsWith("/auth/callback")) return NextResponse.next();

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Zkontroluj zda má hotový onboarding
  const { data: profile } = await supabase.from("profiles").select("onboarding_done").eq("id", user.id).single();
  if (!profile?.onboarding_done && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
