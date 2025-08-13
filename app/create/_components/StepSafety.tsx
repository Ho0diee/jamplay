"use client"
import * as React from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectItem } from "@/components/ui/select"
import type { CreateDraft } from "@/lib/create-schema"

const ages = [
  { value: "everyone", label: "Everyone" },
  { value: "teen", label: "Teen" },
  { value: "mature", label: "Mature" },
]

export default function StepSafety({
  value,
  onChange,
  errors,
}: {
  value: CreateDraft
  onChange: (patch: Partial<CreateDraft>) => void
  errors?: { fieldErrors?: Record<string, string[]> }
}) {
  const fieldError = (name: string) => {
    const list = errors?.fieldErrors?.[name]
    return list && list.length ? list[0] : undefined
  }

  return (
    <div className="space-y-6">
      {errors && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Please fix the highlighted errors.
        </div>
      )}
      <Card>
        <CardTitle>Safety & Rights</CardTitle>
        <CardDescription>Confirm you have rights and agree to policies.</CardDescription>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <input
              id="rights"
              type="checkbox"
              checked={!!value.rightsConfirmed}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ rightsConfirmed: e.target.checked })}
            />
            <label htmlFor="rights">I confirm I have the rights to publish this content.</label>
          </div>
          {fieldError("rightsConfirmed") && <p className="-mt-2 text-xs text-red-600">{fieldError("rightsConfirmed")}</p>}

          <div className="flex items-center gap-2 text-sm">
            <input
              id="policy"
              type="checkbox"
              checked={!!value.policyConfirmed}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ policyConfirmed: e.target.checked })}
            />
            <label htmlFor="policy">I agree to the content policy and community guidelines.</label>
          </div>
          {fieldError("policyConfirmed") && <p className="-mt-2 text-xs text-red-600">{fieldError("policyConfirmed")}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Age guidance</label>
            <Select value={value.ageGuidance as string | undefined} onValueChange={(v) => onChange({ ageGuidance: v as any })}>
              {ages.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </Select>
            {fieldError("ageGuidance") && <p className="mt-1 text-xs text-red-600">{fieldError("ageGuidance")}</p>}
          </div>
        </div>
      </Card>
    </div>
  )
}
