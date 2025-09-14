"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function UserInfo() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <span className="text-sm text-muted-foreground">Loading…</span>;
  }

  if (!email) {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline-block">
        {email}
      </span>
      <SignOutButton />
    </div>
  );
}
