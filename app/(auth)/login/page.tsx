"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/buyers";

  useEffect(() => {
    // If already signed in, skip login and go to redirect target
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(redirect);
      }
    });
  }, [router, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const callbackUrl = `${
        location.origin
      }/auth/callback?redirect=${encodeURIComponent(redirect)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      if (!error) setSent(true);
      else alert(error.message);
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-md border bg-background px-3 py-2"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending..." : "Send link"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
