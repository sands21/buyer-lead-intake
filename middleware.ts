import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(_req: NextRequest) {
  // Temporarily disable auth redirects here to avoid loops; server layouts handle protection
  return NextResponse.next();
}

export const config = {
  matcher: ["/buyers/:path*"],
};
