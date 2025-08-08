import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const { event, session } = await req.json();

  const res = NextResponse.json({ ok: true });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
        set: (name, value, options) => res.cookies.set(name, value, options),
        remove: (name, options) => res.cookies.set(name, "", { ...options, maxAge: 0 }),
      },
    }
  );

  // Handle initial, sign-in, and refresh
  if ((event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }
  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return res;
}
