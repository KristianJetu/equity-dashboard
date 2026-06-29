import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Allow inbound email webhook without auth
  if (req.nextUrl.pathname.startsWith("/api/inbound-email")) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  const validAuth =
    "Basic " +
    Buffer.from(
      `${process.env.BASIC_AUTH_USER}:${process.env.BASIC_AUTH_PASS}`
    ).toString("base64");

  if (auth !== validAuth) {
    return new NextResponse("Přístup odepřen", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Equity Dashboard"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
