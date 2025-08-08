"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthListener() {
  useEffect(() => {
    const sync = async (event: string, session: any) => {
      await fetch("/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ event, session }),
      });
    };

    // 1) Force the OAuth code->session exchange after Google redirect
    supabase.auth.exchangeCodeForSession().then(({ data }) => {
      if (data?.session) sync("SIGNED_IN", data.session); // immediately sync cookies
    });

    // 2) Send initial session (may be null on first load)
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) sync("INITIAL_SESSION", data.session);
    });

    // 3) Keep syncing on any auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      sync(event, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
