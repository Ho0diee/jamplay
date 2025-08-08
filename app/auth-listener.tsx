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

    // Send the initial session on first load (this was missing before)
    supabase.auth.getSession().then(({ data }) => {
      sync("INITIAL_SESSION", data.session);
    });

    // Keep syncing on changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      sync(event, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
