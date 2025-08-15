"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardShell from "./_components/WizardShell";
// Inline Basics and Review to meet new spec without touching other components
import StepBuild from "./_components/StepBuild";
// Safety is inlined here to control banner gating
import { BasicsSchema, MediaSchema, BuildSchema, SafetySchema, type CreateDraft } from "@/lib/create-schema";
import { slugify } from "@/lib/slug";
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
  // new logical steps: 0 basics, 1 media, 2 build, 3 safety, 4 review (gameplay & community removed)
  const [lstep, setLStep] = React.useState(0);
  const [attempted, setAttempted] = React.useState<Set<number>>(new Set());
  const [draft, setDraft] = React.useState<CreateDraft>({
    title: "",
    category: "",
    cover: undefined,
    gallery: [],
    trailerUrl: "",
    description: "",
    instructions: "",
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
    description: draft.description,
    slug: slugify(draft.title || ""),
  }), [draft.title, draft.category, draft.description]);

  const mediaRes = React.useMemo(() => MediaSchema.safeParse({
    cover: draft.cover,
    gallery: draft.gallery,
    trailerUrl: draft.trailerUrl || undefined,
  }), [draft.cover, draft.gallery, draft.trailerUrl]);

  const buildRes = React.useMemo(() => BuildSchema.safeParse({
    launchType: draft.launchType,
    playUrlOrTemplateId: draft.playUrlOrTemplateId,
    version: draft.version || "1",
  instructions: draft.instructions,
  sessionLength: draft.sessionLength,
  }), [draft.launchType, draft.playUrlOrTemplateId, draft.version, draft.instructions, draft.sessionLength]);

  const safetyRes = React.useMemo(() => SafetySchema.safeParse({
    rightsConfirmed: !!draft.rightsConfirmed,
    policyConfirmed: !!draft.policyConfirmed,
    ageGuidance: draft.ageGuidance,
  }), [draft.rightsConfirmed, draft.policyConfirmed, draft.ageGuidance]);
  
  const logicalValid = lstep === 0 ? basicsRes.success
    : lstep === 1 ? mediaRes.success
    : lstep === 2 ? buildRes.success
    : lstep === 3 ? safetyRes.success
    : true;

  async function onPublish() {
    // validate required steps
    const req = [basicsRes, mediaRes, buildRes, safetyRes];
    for (let i = 0; i < req.length; i++) {
      if (!req[i].success) { setLStep(i); return; }
    }
    const nowIso = new Date().toISOString();
    const computedSlug = slugify(draft.title || "");
    let existingVersion = 0
    let finalSlug = computedSlug
    try {
      const raw = localStorage.getItem("myGames")
      const arr = raw ? (JSON.parse(raw) as any[]) : []
      const bySlug = new Map<string, any>()
      for (const g of Array.isArray(arr) ? arr : []) {
        const gs = (g?.slug || "").toString().toLowerCase()
        if (gs) bySlug.set(gs, g)
      }
      const original = originalSlugRef.current?.toLowerCase() || null
      if (original) {
        const og = bySlug.get(original)
        if (og && typeof og.version === "number") existingVersion = og.version
      }
      // finalize slug and construct object
      finalSlug = computedSlug
      const game: any = {
        slug: finalSlug,
        title: (draft.title || "").trim(),
        description: (draft.description || "").trim(),
        instructions: (draft.instructions || "").trim(),
        sessionLength: draft.sessionLength || "",
        category: draft.category || undefined,
        cover: draft.cover || "/logo.svg",
        gallery: draft.gallery,
        trailer: draft.trailerUrl || undefined,
        launchType: draft.launchType,
        playUrlOrTemplateId: draft.playUrlOrTemplateId,
        publishedAt: nowIso,
        updatedAt: nowIso,
        plays48h: 0,
        likes7d: { up: 0, total: 0 },
        likesAll: { up: 0, total: 0 },
        version: existingVersion || Number(draft.version) || 1,
        origin: "local" as const,
        visibility: "public",
      }

      // merge into localStorage by slug; delete old if editing and slug changed
      if (original && original !== finalSlug.toLowerCase()) bySlug.delete(original)
      bySlug.set(finalSlug.toLowerCase(), game)
      localStorage.setItem("myGames", JSON.stringify(Array.from(bySlug.values())))
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent("catalog:changed", { detail: { slug: finalSlug } }))
    } catch {}
    router.push(`/game/${finalSlug}`)
  }

  function onSaveDraft() {
    try {
      localStorage.setItem("createDraft", JSON.stringify(draft));
    } catch {}
  }

  // Always-visible errors
  const basicsErrors = basicsRes.success ? undefined : basicsRes.error.flatten();
  const mediaErrors = mediaRes.success ? undefined : mediaRes.error.flatten();
  const buildErrors = buildRes.success ? undefined : buildRes.error.flatten();
  const safetyErrors = safetyRes.success ? undefined : safetyRes.error.flatten();
  const bannedTitle = checkBanned(draft.title || "");
  const bannedDesc = checkBanned(draft.description || "");

  // Map logical to UI steps, skipping Gameplay (2) and Community (4) in the shell.
  // UI steps (WizardShell): 0 basics, 1 media, 2 gameplay, 3 build, 4 community, 5 safety, 6 review
  // Logical steps:          0 basics, 1 media,            2 build,             3 safety, 4 review
  const uiStep = lstep === 0 ? 0 : lstep === 1 ? 1 : lstep === 2 ? 3 : lstep === 3 ? 5 : 6
  const setUIStep = (idx: number) => {
    // Route gameplay (2) to build (logical 2), community (4) to safety (logical 3)
    if (idx === 0) return setLStep(0)
    if (idx === 1) return setLStep(1)
    if (idx === 2 || idx === 3) return setLStep(2)
    if (idx === 4 || idx === 5) return setLStep(3)
    return setLStep(4)
  }
  const finalCanContinue = (uiStep === 6 ? false : logicalValid) && !(lstep === 0 && (!bannedTitle.ok || !bannedDesc.ok));

  const onTryContinue = React.useCallback(() => {
    setAttempted((prev: Set<number>) => new Set([...prev, lstep]))
  }, [lstep])

  return (
  <WizardShell step={uiStep} setStep={setUIStep} canContinue={finalCanContinue} onTryContinue={onTryContinue}>
      {uiStep === 0 && (
        <div className="space-y-6">
          {attempted.has(0) && (!bannedTitle.ok || !bannedDesc.ok || basicsErrors) && (
            <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
              { !bannedTitle.ok
                ? "Banned words detected in title."
                : (!bannedDesc.ok
                  ? "Banned words detected in description."
                  : ((basicsErrors as any)?.fieldErrors && (Object.values((basicsErrors as any).fieldErrors)[0] as any)?.[0])
                ) }
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
    <label className="mb-1 block text-sm font-medium">One-sentence description (max 20 words)</label>
                <Input value={draft.description} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>patch({ description: e.target.value })} placeholder="Pitch your game in one sentence" />
    {!bannedDesc.ok && <p className="mt-1 text-xs text-red-600">Please remove banned words.</p>}
    {basicsErrors?.fieldErrors?.description?.[0] && <p className="mt-1 text-xs text-red-600">{(basicsErrors.fieldErrors as any).description[0]}</p>}
              </div>
            </div>
          </Card>
        </div>
      )}
  {uiStep === 1 && (
        <div className="space-y-6">
    {attempted.has(1) && mediaErrors && (
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
  {uiStep === 3 && (
        <div className="space-y-6">
          {attempted.has(2) && buildErrors && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Please fix the highlighted errors.</div>
          )}
          <StepBuild value={draft} onChange={patch} errors={buildErrors as any} />
          <Card>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Explain how to play. Keep it concise.</CardDescription>
            <div className="mt-4 space-y-3">
              <Textarea value={draft.instructions || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>patch({ instructions: e.target.value })} placeholder="Explain how the game works." />
              {buildErrors?.fieldErrors?.instructions?.[0] && <p className="mt-1 text-xs text-red-600">{(buildErrors.fieldErrors as any).instructions[0]}</p>}
            </div>
          </Card>
          <Card>
            <CardTitle>Session length</CardTitle>
            <CardDescription>Use minutes (1–300) or a range like 10-20.</CardDescription>
            <div className="mt-4">
              <Input value={draft.sessionLength || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>patch({ sessionLength: e.target.value })} placeholder="e.g., 10-20" />
              {buildErrors?.fieldErrors?.sessionLength?.[0] && <p className="mt-1 text-xs text-red-600">{(buildErrors.fieldErrors as any).sessionLength[0]}</p>}
            </div>
          </Card>
        </div>
      )}
      {uiStep === 5 && (
        <div className="space-y-6">
          {attempted.has(3) && safetyErrors && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Please fix the highlighted errors.</div>
          )}
          <Card>
            <CardTitle>Safety & Rights</CardTitle>
            <CardDescription>Confirm you have rights and agree to policies.</CardDescription>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <input id="rights" type="checkbox" checked={!!draft.rightsConfirmed} onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ rightsConfirmed: e.target.checked })} />
                <label htmlFor="rights">I confirm I have the rights to publish this content.</label>
              </div>
              {(safetyErrors as any)?.fieldErrors?.rightsConfirmed?.[0] && <p className="-mt-2 text-xs text-red-600">{(safetyErrors as any).fieldErrors.rightsConfirmed[0]}</p>}

              <div className="flex items-center gap-2 text-sm">
                <input id="policy" type="checkbox" checked={!!draft.policyConfirmed} onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ policyConfirmed: e.target.checked })} />
                <label htmlFor="policy">I agree to the content policy and community guidelines.</label>
              </div>
              {(safetyErrors as any)?.fieldErrors?.policyConfirmed?.[0] && <p className="-mt-2 text-xs text-red-600">{(safetyErrors as any).fieldErrors.policyConfirmed[0]}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium">Age guidance</label>
                <Select value={draft.ageGuidance as string | undefined} onValueChange={(v) => patch({ ageGuidance: v as any })}>
                  {[{value:"everyone",label:"Everyone"},{value:"teen",label:"Teen"},{value:"mature",label:"Mature"}].map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </Select>
                {(safetyErrors as any)?.fieldErrors?.ageGuidance?.[0] && <p className="mt-1 text-xs text-red-600">{(safetyErrors as any).fieldErrors.ageGuidance[0]}</p>}
              </div>
            </div>
          </Card>
        </div>
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
