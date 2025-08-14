"use client";
import type React from "react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectItem } from "@/components/ui/select";
import ImageCropper from "./_components/ImageCropper";
import ControlsPresets from "./_components/ControlsPresets";
import { slugify, normalizeTags } from "@/lib/slug";
import { BasicsSchema, MediaSchema, GameplaySchema, BuildSchema, SafetySchema } from "@/lib/create-schema";
import { isYouTubeUrl } from "@/lib/youtube";
import { createGameAction } from "./actions";

type SessionNorm = { type: "single"; minutes: number } | { type: "range"; min: number; max: number };

const categories = ["Adventure","RPG","Puzzle","Horror","Sci-Fi","Romance"];

export default function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const originalSlugRef = useRef<string | null>(null);
  const [step, setStep] = useState(0); // 0..5
  const [attempted, setAttempted] = useState<Set<number>>(() => new Set());

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const autoSlug = useMemo(() => slugify(title || ""), [title]);

  // Step 2: Media
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [trailer, setTrailer] = useState<string>("");

  // Step 3: Gameplay
  const [description, setDescription] = useState("");
  const [controls, setControls] = useState("");
  const [sessionLength, setSessionLength] = useState("");

  // Step 4: Build & Access
  const [launchType, setLaunchType] = useState<"external"|"embedded_template"|"api_endpoint"|"">("");
  const [playTarget, setPlayTarget] = useState("");
  const [version] = useState("1");

  // Step 5: Safety
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [policyConfirmed, setPolicyConfirmed] = useState(false);
  const [ageGuidance, setAgeGuidance] = useState<"everyone"|"teen"|"mature"|"">("");

  // Edit mode: /create?edit=slug
  useEffect(() => {
    const edit = searchParams.get("edit");
    if (!edit || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("myGames");
      if (!raw) return;
      const arr = JSON.parse(raw) as any[];
      const item = (arr || []).find((g) => (g?.slug || "").toLowerCase() === edit.toLowerCase());
  if (!item) return;
      setTitle(item.title || "");
      setCategory(item.category || "");
      setTags(Array.isArray(item.tags) ? item.tags : []);
      setCover(item.cover || null);
      setThumb(item.thumb || null);
      setGallery(Array.isArray(item.gallery) ? item.gallery : []);
      setTrailer(item.trailer || "");
      setDescription(item.description || "");
      setControls(item.controls || "");
      if (item.sessionLength) {
        if (typeof item.sessionLength === "string") setSessionLength(item.sessionLength);
        else if (item.sessionLength.type === "single") setSessionLength(String(item.sessionLength.minutes));
        else if (item.sessionLength.type === "range") setSessionLength(`${item.sessionLength.min}-${item.sessionLength.max}`);
      }
  setLaunchType(item.launchType || "");
      setPlayTarget(item.playUrlOrTemplateId || "");
      setRightsConfirmed(!!item.rightsConfirmed);
      setPolicyConfirmed(!!item.policyConfirmed);
      setAgeGuidance(item.ageGuidance || "");
  originalSlugRef.current = item.slug || null;
    } catch {}
  }, [searchParams]);

  const stepError = (idx: number): string | null => {
    if (!attempted.has(idx)) return null;
    if (idx === 0) {
      const res = BasicsSchema.safeParse({ title, category, tags, slug: autoSlug });
      return res.success ? null : "Please fix mistakes";
    }
    if (idx === 1) {
      const res = MediaSchema.safeParse({ cover, thumb, gallery, trailerUrl: trailer || undefined });
      return res.success ? null : "Please fix mistakes";
    }
    if (idx === 2) {
      const res = GameplaySchema.safeParse({ description, sessionLength });
      return res.success ? null : "Please fix mistakes";
    }
    if (idx === 3) {
      const res = BuildSchema.safeParse({ launchType: launchType || undefined, playUrlOrTemplateId: playTarget, version });
      return res.success ? null : "Please fix mistakes";
    }
    if (idx === 4) {
      const res = SafetySchema.safeParse({ rightsConfirmed, policyConfirmed, ageGuidance });
      return res.success ? null : "Please confirm required items";
    }
    return null;
  };

  const canContinue = (idx: number): boolean => {
    if (idx === 0) return BasicsSchema.safeParse({ title, category, tags, slug: autoSlug }).success;
    if (idx === 1) return MediaSchema.safeParse({ cover, thumb, gallery, trailerUrl: trailer || undefined }).success;
    if (idx === 2) return GameplaySchema.safeParse({ description, sessionLength }).success;
    if (idx === 3) return BuildSchema.safeParse({ launchType: launchType || undefined, playUrlOrTemplateId: playTarget, version }).success;
    if (idx === 4) return SafetySchema.safeParse({ rightsConfirmed, policyConfirmed, ageGuidance }).success;
    return true;
  };

  const next = () => {
    if (!canContinue(step)) {
      setAttempted((prev: Set<number>) => new Set(prev).add(step));
      return;
    }
    setStep((s: number) => Math.min(5, s + 1));
  };
  const back = () => setStep((s: number) => Math.max(0, s - 1));

  const onAddTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t) return;
    const next = normalizeTags([...(tags ?? []), t]);
    setTags(next.slice(0, 10));
    setTagInput("");
  }, [tagInput, tags]);

  const onPublish = async () => {
    // final validation
    for (let i = 0; i < 5; i++) {
  if (!canContinue(i)) { setAttempted((p: Set<number>) => new Set(p).add(i)); setStep(i); return; }
    }
    // server slug uniqueness
    const res = await createGameAction({ title: title.trim(), description: description.trim() });
  if (!res.ok) { setAttempted((p: Set<number>) => new Set(p).add(5)); return; }
    const slug = res.slug;
    const nowIso = new Date().toISOString();
    const game: any = {
      slug,
      title: title.trim(),
      description: description.trim(),
      tags,
      category: category || undefined,
      cover: cover || "/logo.svg",
      thumb: thumb || "/logo.svg",
      gallery,
      trailer: trailer || undefined,
      publishedAt: nowIso,
      updatedAt: nowIso,
      plays48h: 0,
      likes7d: { up: 0, total: 0 },
      likesAll: { up: 0, total: 0 },
      editorsPick: false,
      version: 1,
      origin: "local" as const,
    };
    try {
      const raw = localStorage.getItem("myGames");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const bySlug = new Map<string, any>();
      for (const g of Array.isArray(arr) ? arr : []) {
        const gs = (g?.slug || "").toString().toLowerCase();
        if (gs) bySlug.set(gs, g);
      }
      const original = originalSlugRef.current?.toLowerCase() || null;
      if (original && original !== slug.toLowerCase()) {
        bySlug.delete(original);
      }
      bySlug.set(slug.toLowerCase(), game);
      localStorage.setItem("myGames", JSON.stringify(Array.from(bySlug.values())));
    } catch {}
    router.push(`/game/${slug}`);
  };

  return (
    <Card className="max-w-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create a game</h1>
        <div className="text-sm">Step {step+1} of 6</div>
      </div>

      {attempted.has(step) && stepError(step) && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{stepError(step)}</div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="My Cool Game" />
            {!!autoSlug && <p className="text-xs text-neutral-500">URL: /game/{autoSlug}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(v: string)=>setCategory(v)} placeholder="Select category">
              {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e)=>setTagInput(e.target.value)} placeholder="Add a tag and press Enter"
                onKeyDown={(e)=>{ if (e.key === "Enter") { e.preventDefault(); onAddTag(); } }} />
              <Button type="button" variant="secondary" onClick={onAddTag}>Add</Button>
            </div>
            {tags.length>0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t)=> (
                  <span key={t} className="rounded border px-2 py-0.5 text-xs">{t}
                    <button className="ml-1" onClick={()=>setTags(tags.filter(x=>x!==t))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Cover (1280×720)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setCoverFile(e.target.files?.[0] ?? null)} />
            {coverFile && (
              <ImageCropper file={coverFile} preset={{ width: 1280, height: 720 }} onChange={(d)=>setCover(d)} />
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Square thumb (512×512)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setThumbFile(e.target.files?.[0] ?? null)} />
            {thumbFile && (
              <ImageCropper file={thumbFile} preset={{ width: 512, height: 512 }} onChange={(d)=>setThumb(d)} />
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Trailer (YouTube, optional)</label>
            <Input value={trailer} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setTrailer(e.target.value)} placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." />
            {!!trailer && !isYouTubeUrl(trailer) && attempted.has(1) && (
              <p className="text-xs text-red-600">Enter a valid YouTube URL</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setDescription(e.target.value)} rows={6} placeholder="This is the only text that will be persisted." />
          </div>
          <div>
            <label className="text-sm font-medium">Controls</label>
            <ControlsPresets value={controls} onChange={setControls} />
          </div>
          <div>
            <label className="text-sm font-medium">Session length (minutes or m-n)</label>
            <Input value={sessionLength} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSessionLength(e.target.value)} placeholder="10 or 5-20" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Launch type</label>
            <Select value={launchType} onValueChange={(v: string)=>setLaunchType(v as any)} placeholder="Select type">
              <SelectItem value="external">external</SelectItem>
              <SelectItem value="embedded_template">embedded_template</SelectItem>
              <SelectItem value="api_endpoint">api_endpoint</SelectItem>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Target</label>
            <Input value={playTarget} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setPlayTarget(e.target.value)} placeholder={launchType === "external" ? "https://..." : (launchType === "embedded_template" ? "TMP-ABCDE" : "Endpoint path") } />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input id="rights" type="checkbox" checked={rightsConfirmed} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setRightsConfirmed(e.target.checked)} />
            <label htmlFor="rights" className="text-sm">I confirm I own the rights to publish this game.</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="policy" type="checkbox" checked={policyConfirmed} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setPolicyConfirmed(e.target.checked)} />
            <label htmlFor="policy" className="text-sm">I accept the content policy.</label>
          </div>
          <div>
            <label className="text-sm font-medium">Age guidance</label>
            <Select value={ageGuidance} onValueChange={(v: string)=>setAgeGuidance(v as any)} placeholder="Select">
              <SelectItem value="everyone">everyone</SelectItem>
              <SelectItem value="teen">teen</SelectItem>
              <SelectItem value="mature">mature</SelectItem>
            </Select>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="rounded border p-3 text-sm">
            <div className="font-medium mb-2">Review</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Title: {title}</li>
              <li>Slug: {autoSlug}</li>
              <li>Category: {category || "—"}</li>
              <li>Tags: {tags.join(", ") || "—"}</li>
              <li>Description: {description.slice(0,100)}{description.length>100?"…":""}</li>
              <li>Trailer: {trailer || "—"}</li>
              <li>Launch: {launchType || "—"} → {playTarget || "—"}</li>
              <li>Safety: {rightsConfirmed && policyConfirmed && ageGuidance ? "ok" : "incomplete"}</li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={back} disabled={step===0}>Back</Button>
        {step < 5 ? (
          <Button type="button" onClick={next}>Continue</Button>
        ) : (
          <Button type="button" onClick={onPublish}>Publish</Button>
        )}
      </div>
    </Card>
  );
}
