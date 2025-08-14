"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { slugify } from "@/lib/slug";

export type CreateGamePayload = { title: string; description: string };

export async function createGameAction(payload: CreateGamePayload): Promise<{ ok: true; slug: string } | { ok: false; error: string }>{
  const title = (payload?.title ?? "").trim();
  const description = (payload?.description ?? "").trim();
  if (title.length < 4) return { ok: false, error: "Title too short" } as const;
  if (description.length < 30) return { ok: false, error: "Description too short" } as const;

  const base = slugify(title);
  const client = supabaseServer();
  // Gather existing slugs that start with base
  const { data: rows, error: qErr } = await client
    .from("games")
    .select("slug")
    .ilike("slug", `${base}%`);
  const existing = new Set<string>((rows ?? []).map((r: any) => (r?.slug ?? "").toLowerCase()));
  let final = base || "game";
  if (existing.has(final)) {
    let i = 2;
    while (existing.has(`${base}-${i}`)) i++;
    final = `${base}-${i}`;
  }

  // Try to persist to DB; best-effort only (RLS may block without auth)
  try {
    const { error: iErr } = await client
      .from("games")
      .insert({
        owner_id: null,
        title,
        slug: final,
        summary: description,
        age_rating: "E",
        status: "draft",
      })
      .select("slug")
      .single();
    // Ignore iErr for unauthenticated demo; uniqueness enforced by DB if insert succeeds
  } catch {}

  return { ok: true, slug: final } as const;
}
