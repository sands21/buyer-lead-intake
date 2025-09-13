"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.replace("/buyers");
        return;
      }
      // Attempt to exchange code if present
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(window.location.href);
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }
      router.replace("/buyers");
    }
    handleCallback();
  }, [router]);

  if (error) return <p className="text-destructive">{error}</p>;
  return <p>Signing you in...</p>;
}
