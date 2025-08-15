"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardShell from "./_components/WizardShell";
// Inline Basics, Gameplay, and Review to meet new spec without touching other components
import StepBuild from "./_components/StepBuild";
import StepSafety from "./_components/StepSafety";
import { BasicsSchema, MediaSchema, GameplaySchema, BuildSchema, SafetySchema, type CreateDraft } from "@/lib/create-schema";
import { slugify } from "@/lib/slug";
import { createGameAction } from "./actions";
import { checkBanned } from "@/lib/banlist";
import ImageCropper from "./_components/ImageCropper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export default function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const originalSlugRef = React.useRef<string | null>(null);
  // logical steps: 0 basics, 1 media, 2 gameplay, 3 build, 4 safety, 5 review
  const [lstep, setLStep] = React.useState(0);
  const [draft, setDraft] = React.useState<CreateDraft>({
    title: "",
    category: "",
    cover: undefined,
    gallery: [],
    trailerUrl: "",
    description: "",
    instructions: "",
    controls: "",
    sessionLength: "",
    launchType: undefined,
    playUrlOrTemplateId: "",
    version: "1",
    changelog: "",
    rightsConfirmed: false,
    policyConfirmed: false,
    ageGuidance: undefined,
    visibility: "draft",
    slug: "",
  } as any);
  // Media step local state for files-only workflow
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [galleryQueue, setGalleryQueue] = React.useState<File[]>([]);
  const [galleryWorking, setGalleryWorking] = React.useState<File | null>(null);
  const [pendingGallery, setPendingGallery] = React.useState<string | null>(null);

  const patch = (p: Partial<CreateDraft>) => setDraft((d: CreateDraft) => ({ ...d, ...p }));

  // Edit mode from local storage
  React.useEffect(() => {
    const edit = searchParams.get("edit");
    if (!edit || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("myGames");
      if (!raw) return;
      const arr = JSON.parse(raw) as any[];
      const item = (arr || []).find((g) => (g?.slug || "").toLowerCase() === edit.toLowerCase());
      if (!item) return;
      const next: Partial<CreateDraft> = {
        title: item.title || "",
        category: item.category || "",
        cover: item.cover || undefined,
        gallery: Array.isArray(item.gallery) ? item.gallery : [],
        trailerUrl: item.trailer || "",
        description: item.description || "",
        instructions: item.instructions || "",
        controls: item.controls || "",
        sessionLength: typeof item.sessionLength === "string"
          ? item.sessionLength
          : item.sessionLength?.type === "single"
          ? String(item.sessionLength.minutes)
          : item.sessionLength?.type === "range"
          ? `${item.sessionLength.min}-${item.sessionLength.max}`
          : "",
        launchType: item.launchType || undefined,
        playUrlOrTemplateId: item.playUrlOrTemplateId || "",
        rightsConfirmed: !!item.rightsConfirmed,
        policyConfirmed: !!item.policyConfirmed,
        ageGuidance: item.ageGuidance || undefined,
        visibility: item.visibility || "draft",
      } as any;
      setDraft((d: CreateDraft) => ({ ...d, ...next }));
      originalSlugRef.current = item.slug || null;
    } catch {}
  }, [searchParams]);

  // Validation helpers
  const basicsRes = React.useMemo(() => BasicsSchema.safeParse({
    title: draft.title,
    category: draft.category,
    slug: slugify(draft.title || ""),
  }), [draft.title, draft.category]);

  const mediaRes = React.useMemo(() => MediaSchema.safeParse({
    cover: draft.cover,
    gallery: draft.gallery,
    trailerUrl: draft.trailerUrl || undefined,
  }), [draft.cover, draft.gallery, draft.trailerUrl]);

  const gameplayRes = React.useMemo(() => GameplaySchema.safeParse({
    description: draft.description,
    instructions: draft.instructions,
    sessionLength: draft.sessionLength,
  }), [draft.description, draft.instructions, draft.sessionLength]);

  const buildRes = React.useMemo(() => BuildSchema.safeParse({
    launchType: draft.launchType,
    playUrlOrTemplateId: draft.playUrlOrTemplateId,
    version: draft.version || "1",
  }), [draft.launchType, draft.playUrlOrTemplateId, draft.version]);

  const safetyRes = React.useMemo(() => SafetySchema.safeParse({
    rightsConfirmed: !!draft.rightsConfirmed,
    policyConfirmed: !!draft.policyConfirmed,
    ageGuidance: draft.ageGuidance,
  }), [draft.rightsConfirmed, draft.policyConfirmed, draft.ageGuidance]);
  
  const logicalValid = lstep === 0 ? basicsRes.success
    : lstep === 1 ? mediaRes.success
    : lstep === 2 ? gameplayRes.success
    : lstep === 3 ? buildRes.success
    : lstep === 4 ? safetyRes.success
    : true;

  async function onPublish() {
    // validate required steps
    const req = [basicsRes, mediaRes, gameplayRes, buildRes, safetyRes];
    for (let i = 0; i < req.length; i++) {
      if (!req[i].success) { setLStep(i); return; }
    }
    const res = await createGameAction({ title: (draft.title || "").trim(), description: (draft.description || "").trim() });
    if (!res.ok) { return; }
    const slug = res.slug;
    const nowIso = new Date().toISOString();
    const game: any = {
      slug,
      title: (draft.title || "").trim(),
      description: (draft.description || "").trim(),
      category: draft.category || undefined,
      cover: draft.cover || "/logo.svg",
      gallery: draft.gallery,
      trailer: draft.trailerUrl || undefined,
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
      if (original && original !== slug.toLowerCase()) bySlug.delete(original);
      bySlug.set(slug.toLowerCase(), game);
      localStorage.setItem("myGames", JSON.stringify(Array.from(bySlug.values())));
    } catch {}
    router.push(`/game/${slug}`);
  }

  function onSaveDraft() {
    try {
      localStorage.setItem("createDraft", JSON.stringify(draft));
    } catch {}
  }

  // Always-visible errors
  const basicsErrors = basicsRes.success ? undefined : basicsRes.error.flatten();
  const mediaErrors = mediaRes.success ? undefined : mediaRes.error.flatten();
  const gameplayErrors = gameplayRes.success ? undefined : gameplayRes.error.flatten();
  const buildErrors = buildRes.success ? undefined : buildRes.error.flatten();
  const safetyErrors = safetyRes.success ? undefined : safetyRes.error.flatten();
  const bannedTitle = checkBanned(draft.title || "");
  const bannedDesc = checkBanned(draft.description || "");
  
  // Map logical step to WizardShell UI step (community at 4 is skipped visually by mapping to safety)
  // UI steps (WizardShell): 0 basics, 1 media, 2 gameplay, 3 build, 4 community, 5 safety, 6 review
  // Logical steps:         0 basics, 1 media, 2 gameplay, 3 build,            4 safety, 5 review
  const uiStep = lstep < 4 ? lstep : (lstep === 4 ? 5 : 6)
  const setUIStep = (idx: number) => {
    if (idx <= 3) return setLStep(idx)
    if (idx === 4) return setLStep(4) // community button jumps to safety
    if (idx === 5) return setLStep(4) // safety
    return setLStep(5) // review
  }
  const finalCanContinue = (uiStep === 6 ? false : logicalValid) && !(lstep === 0 && !bannedTitle.ok) && !(lstep === 2 && !bannedDesc.ok);

  return (
    <WizardShell step={uiStep} setStep={setUIStep} canContinue={finalCanContinue}>
      {uiStep === 0 && (
        <div className="space-y-6">
          {(!bannedTitle.ok || basicsErrors) && (
            <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
              { !bannedTitle.ok ? "Banned words detected in title." : Object.values(basicsErrors!.fieldErrors || {})[0]?.[0] }
            </div>
          )}
          <Card>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Tell us the essentials about your game.</CardDescription>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <Input value={draft.title} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>patch({ title: e.target.value })} placeholder="e.g., Galactic Chef" maxLength={80} />
                {!bannedTitle.ok && <p className="mt-1 text-xs text-red-600">Please remove banned words.</p>}
                {basicsErrors?.fieldErrors?.title?.[0] && <p className="mt-1 text-xs text-red-600">{(basicsErrors.fieldErrors as any).title[0]}</p>}
                {!!(draft.title?.trim()) && (
                  <p className="mt-1 text-xs text-neutral-500">URL: /game/{slugify(draft.title!)}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <Select value={draft.category} onValueChange={(v: string)=>patch({ category: v })} placeholder="Select category">
                  {["Adventure","RPG","Puzzle","Horror","Sci-Fi","Romance"].map((c)=> (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </Select>
                {basicsErrors?.fieldErrors?.category?.[0] && <p className="mt-1 text-xs text-red-600">{(basicsErrors.fieldErrors as any).category[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">One-sentence description (max 22 words)</label>
                <Input value={draft.description} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>patch({ description: e.target.value })} placeholder="Pitch your game in one sentence" />
              </div>
            </div>
          </Card>
        </div>
      )}
  {uiStep === 1 && (
        <div className="space-y-6">
          {mediaErrors && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Please fix the highlighted errors.</div>
          )}
          <Card>
            <CardTitle>Cover image</CardTitle>
            <CardDescription>16:9 crop at 1280×720. Preview is scaled down.</CardDescription>
            <div className="mt-3 space-y-3">
              <Input type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0] ?? null
                patch({})
                setCoverFile(f)
              }} />
              {coverFile && (
                <ImageCropper file={coverFile} preset={{ width: 1280, height: 720 }} previewWidth={480} onChange={(d)=>patch({ cover: d || undefined })} />
              )}
              {!coverFile && draft.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.cover} alt="Cover preview" className="h-auto w-[480px] rounded border object-cover" />
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Gallery (up to 5)</CardTitle>
            <CardDescription>Each image must be cropped to 16:9 before adding.</CardDescription>
            <div className="mt-3 space-y-3">
              <Input type="file" accept="image/*" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                const files = Array.from(e.target.files ?? [])
                if (!files.length) return
                // Take one at a time to crop
                setGalleryQueue(files)
                setGalleryWorking(files[0] || null)
              }} />
              {galleryWorking && (
                <div>
                  <ImageCropper file={galleryWorking} preset={{ width: 1280, height: 720 }} previewWidth={360} onChange={(data)=>setPendingGallery(data)} />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={()=>{
                      if (pendingGallery) patch({ gallery: [...(draft.gallery ?? []), pendingGallery].slice(0,5) })
                      const rest = galleryQueue.slice(1)
                      setGalleryQueue(rest)
                      setGalleryWorking(rest[0] || null)
                      setPendingGallery(null)
                    }}>Add to gallery</Button>
                    <Button size="sm" variant="outline" onClick={()=>{
                      const rest = galleryQueue.slice(1)
                      setGalleryQueue(rest)
                      setGalleryWorking(rest[0] || null)
                      setPendingGallery(null)
                    }}>Skip</Button>
                  </div>
                </div>
              )}
              {!!(draft.gallery?.length) && (
                <div className="grid grid-cols-3 gap-2">
                  {draft.gallery!.map((g, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g} className="aspect-video w-full rounded border object-cover" />
                      <button className="absolute right-1 top-1 rounded bg-white/80 px-1 text-xs" onClick={()=>patch({ gallery: draft.gallery!.filter((_, idx)=>idx!==i) })}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      {uiStep === 2 && (
        <div className="space-y-6">
          {(!gameplayRes.success || !checkBanned(draft.description || "").ok) && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">{!checkBanned(draft.description || "").ok ? "Banned words detected in description." : (Object.values(gameplayErrors!.fieldErrors || {})[0]?.[0] ?? "Fix errors below.")}</div>
          )}
          <Card>
            <CardTitle>Gameplay</CardTitle>
            <CardDescription>Describe how it plays and what to expect.</CardDescription>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">One-sentence description (max 22 words)</label>
                <Input value={draft.description} onChange={(e)=>patch({ description: e.target.value })} placeholder="A concise one-sentence description" />
                {!bannedDesc.ok && <p className="mt-1 text-xs text-red-600">Please remove banned words.</p>}
                {gameplayErrors?.fieldErrors?.description?.[0] && <p className="mt-1 text-xs text-red-600">{gameplayErrors.fieldErrors.description[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Instructions</label>
                <Textarea value={draft.instructions || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>patch({ instructions: e.target.value })} placeholder="Explain how the game works and the controls. Keep it concise." />
                {gameplayErrors?.fieldErrors?.instructions?.[0] && <p className="mt-1 text-xs text-red-600">{gameplayErrors.fieldErrors.instructions[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Controls</label>
                <Input value={draft.controls || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>patch({ controls: e.target.value })} placeholder="e.g., WASD to move, Space to jump" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Session length</label>
                <Input value={draft.sessionLength || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>patch({ sessionLength: e.target.value })} placeholder="e.g., 10–20 minutes" />
                {gameplayErrors?.fieldErrors?.sessionLength?.[0] && <p className="mt-1 text-xs text-red-600">{(gameplayErrors.fieldErrors as any).sessionLength[0]}</p>}
              </div>
            </div>
          </Card>
        </div>
      )}
  {uiStep === 3 && (
        <StepBuild value={draft} onChange={patch} errors={buildErrors as any} />
      )}
      {uiStep === 5 && (
        <StepSafety value={draft} onChange={patch} errors={safetyErrors as any} />
      )}
      {uiStep === 6 && (
        <div className="space-y-6">
          <Card>
            <CardTitle>Review</CardTitle>
            <CardDescription>Double-check your details, then publish.</CardDescription>
            <div className="mt-4 space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {draft.title}</div>
              <div><span className="font-medium">Category:</span> {draft.category}</div>
              <div><span className="font-medium">Description:</span> {draft.description}</div>
              <div><span className="font-medium">Instructions:</span> {draft.instructions}</div>
            </div>
            <div className="mt-4">
              <Button onClick={onPublish}>Publish</Button>
            </div>
          </Card>
        </div>
      )}
    </WizardShell>
  );
}
