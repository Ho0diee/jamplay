import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const { event, session } = await req.json();

  const res = new NextResponse(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });

  const cookieStore = nextCookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // NEW API (matches CookieMethodsServer)
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
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
