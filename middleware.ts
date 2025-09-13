import { NextRequest, NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // No-op auth middleware for now; protects buyers routes later
  return NextResponse.next();
}

export const config = {
  matcher: ["/buyers/:path*"],
};
