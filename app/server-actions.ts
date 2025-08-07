"use server"

import { z } from "zod"
import { supabaseServer } from "@/lib/supabase-server"
import { CreateGameInput, PublishGameInput } from "@/lib/zod"
import { revalidatePath } from "next/cache"
import crypto from "node:crypto"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function createGame(formData: FormData) {
  const supabase = supabaseServer()
  const parsed = CreateGameInput.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    age_rating: formData.get("age_rating"),
    tags: JSON.parse(String(formData.get("tags") ?? "[]")),
    thumb_url: formData.get("thumb_url") ?? undefined
  })
  if (!parsed.success) throw new Error("Invalid input")

  const slug = slugify(parsed.data.title) + "-" + crypto.randomBytes(3).toString("hex")
  const { data, error } = await supabase.from("games").insert({
    title: parsed.data.title,
    slug,
    summary: parsed.data.summary,
    tags: parsed.data.tags,
    age_rating: parsed.data.age_rating,
    thumb_url: parsed.data.thumb_url,
    status: "draft"
  }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath("/create")
  return data
}

export async function uploadVersion(formData: FormData) {
  const supabase = supabaseServer()
  const game_id = String(formData.get("game_id"))
  const version = String(formData.get("version") ?? "0.1.0")
  const zip_url = String(formData.get("zip_url"))
  // very light validation – PromptScript.json presence is checked client-side or in seed
  const { data, error } = await supabase.from("game_versions").insert({
    game_id, version, promptscript_url: zip_url, assets_zip_url: zip_url, model_lock: "stub-model", seed: 42, notes: "uploaded"
  }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath(`/game/${game_id}`)
  return data
}

export async function publishGame(formData: FormData) {
  const supabase = supabaseServer()
  const parsed = z.object({ game_id: z.string().uuid() }).safeParse({ game_id: formData.get("game_id") })
  if (!parsed.success) throw new Error("Invalid input")
  const { data: game } = await supabase.from("games").select("*").eq("id", parsed.data.game_id).single()
  if (!game) throw new Error("Not found")

  const { error } = await supabase.from("games").update({ status: "public" }).eq("id", game.id)
  if (error) throw new Error(error.message)
  revalidatePath(`/game/${game.slug}`)
  return { ok: true }
}

export async function recordPlayStart(formData: FormData) {
  const supabase = supabaseServer()
  const game_id = String(formData.get("game_id"))
  const version_id = String(formData.get("version_id"))
  const { data, error } = await supabase.from("plays").insert({ game_id, version_id, duration_sec: 0, completed: false, cost_tokens: 0 }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function recordPlayEnd(formData: FormData) {
  const supabase = supabaseServer()
  const play_id = String(formData.get("play_id"))
  const duration_sec = Number(formData.get("duration_sec"))
  const completed = String(formData.get("completed")) === "true"
  const cost_tokens = Number(formData.get("cost_tokens"))
  const { error } = await supabase.from("plays").update({ duration_sec, completed, cost_tokens }).eq("id", play_id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function rateGame(formData: FormData) {
  const supabase = supabaseServer()
  const game_id = String(formData.get("game_id"))
  const score = Number(formData.get("score"))
  const review = String(formData.get("review") ?? "")
  const { error } = await supabase.from("ratings").insert({ game_id, score, review })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function reportGame(formData: FormData) {
  const supabase = supabaseServer()
  const game_id = String(formData.get("game_id"))
  const reason = String(formData.get("reason"))
  const { error } = await supabase.from("reports").insert({ game_id, reason })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function submitToJam(formData: FormData) {
  const supabase = supabaseServer()
  const jam_id = String(formData.get("jam_id"))
  const game_id = String(formData.get("game_id"))
  const notes = String(formData.get("notes") ?? "")
  const { error } = await supabase.from("jam_submissions").insert({ jam_id, game_id, notes })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function adminResolveReport(formData: FormData) {
  const supabase = supabaseServer()
  const id = String(formData.get("report_id"))
  const { error } = await supabase.from("reports").update({ resolved: true }).eq("id", id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function adminFeature(formData: FormData) {
  const supabase = supabaseServer()
  const game_id = String(formData.get("game_id"))
  const placement = String(formData.get("placement"))
  const starts_at = String(formData.get("starts_at"))
  const ends_at = String(formData.get("ends_at"))
  const { error } = await supabase.from("promotions").insert({ game_id, placement, starts_at, ends_at })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function createJam(formData: FormData) {
  const supabase = supabaseServer()
  const title = String(formData.get("title"))
  const theme = String(formData.get("theme"))
  const rules_md = String(formData.get("rules_md"))
  const starts_at = new Date(String(formData.get("starts_at") ?? new Date().toISOString()))
  const ends_at = new Date(String(formData.get("ends_at") ?? new Date(Date.now()+7*864e5).toISOString()))
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g,"")
  const { error } = await supabase.from("jams").insert({ title, slug, theme, rules_md, starts_at, ends_at, prize_pool_cents: 0 })
  if (error) throw new Error(error.message)
  return { ok: true }
}
