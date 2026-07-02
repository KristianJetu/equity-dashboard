import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Allow inbound email webhook without auth
  if (req.nextUrl.pathname.startsWith("/api/inbound-email")) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");

  const users = [
    { user: process.env.BASIC_AUTH_USER, pass: process.env.BASIC_AUTH_PASS },
    { user: "host", pass: "host" },
  ];

  const isValid = users.some(
    ({ user, pass }) =>
      auth === "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
  );

  if (!isValid) {
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
