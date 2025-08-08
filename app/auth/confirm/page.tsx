"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthConfirm() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Exchange the ?code=… in this URL for a session
      const { data } = await supabase.auth.exchangeCodeForSession(window.location.href);

      // Sync session to server cookies
      if (data?.session) {
        await fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event: "SIGNED_IN", session: data.session }),
        });
      }

      // Send the user somewhere useful
      router.replace("/create");
    })();
  }, [router]);

  return <p style={{ padding: 16 }}>Signing you in…</p>;
}
