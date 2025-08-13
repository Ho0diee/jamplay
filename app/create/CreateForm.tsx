"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export default function CreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const s = slugify(slug || title);
    if (t.length < 1 || t.length > 80) {
      setError("Title must be between 1 and 80 characters.");
      return;
    }
    if (!s || /[^a-z0-9-]/.test(s)) {
      setError("Slug must be lowercase letters, numbers, and hyphens.");
      return;
    }
    setError("");
    // Build minimal game object for Home catalog consumption
    const nowIso = new Date().toISOString();
    const game: any = {
      slug: s,
      title: t,
      description: t, // using title as a short tagline placeholder
      tags: [],
      category: undefined,
      cover: "/logo.svg",
      publishedAt: nowIso,
      updatedAt: nowIso,
      plays48h: 0,
      likes7d: { up: 0, total: 0 },
      likesAll: { up: 0, total: 0 },
      editorsPick: false,
      origin: "local",
    };
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("myGames");
        const arr = raw ? (JSON.parse(raw) as any[]) : [];
        const bySlug = new Map<string, any>();
        for (const g of Array.isArray(arr) ? arr : []) {
          const gs = (g?.slug || "").toString().toLowerCase();
          if (gs) bySlug.set(gs, g);
        }
        bySlug.set(s, game); // overwrite existing with same slug
        localStorage.setItem("myGames", JSON.stringify(Array.from(bySlug.values())));
      }
    } catch {
      // ignore localStorage failures
    }
    router.push(`/game/${s}`);
  };

  return (
    <Card className="max-w-md p-4 space-y-3">
      <h1 className="text-xl font-semibold">Create a game</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e: ChangeEvent<HTMLInputElement>)=>setTitle(e.target.value)} placeholder="My Cool Game" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <Input value={slug} onChange={(e: ChangeEvent<HTMLInputElement>)=>setSlug(e.target.value)} placeholder="my-cool-game" />
          <p className="text-xs text-neutral-500">Lowercase, numbers, and hyphens only.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
  <Button type="submit">Publish</Button>
      </form>
    </Card>
  );
}
