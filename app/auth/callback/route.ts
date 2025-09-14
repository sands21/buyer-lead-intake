import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirect = url.searchParams.get("redirect") || "/buyers";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  const res = NextResponse.redirect(new URL(redirect, req.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({
            name,
            value,
            ...options,
            httpOnly: false, // Allow client-side access
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        },
        remove(name, options) {
          res.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth error:", error);
      return NextResponse.redirect(
        new URL(`/login?error=${error.message}`, req.url)
      );
    }

    console.log("Session created:", !!data.session);
  } catch (err) {
    console.error("Exchange error:", err);
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", req.url)
    );
  }

  return res;
}
