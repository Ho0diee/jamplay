"use client"
import * as React from "react"

type PresetKey = "wasd" | "arrows" | "touch" | "custom"

const PRESETS: Record<Exclude<PresetKey, "custom">, string[]> = {
  wasd: [
    "W/A/S/D: Move",
    "Space: Action",
    "E: Interact",
  ],
  arrows: [
    "Arrow keys: Move",
    "Z/X: Action",
    "Enter: Interact",
  ],
  touch: [
    "Tap: Interact",
    "Swipe: Move",
    "Long press: Menu",
  ],
}

export default function ControlsPresets({ value, onChange }: { value?: string; onChange: (next: string) => void }) {
  const [mode, setMode] = React.useState<PresetKey>("wasd")
  const [custom, setCustom] = React.useState<string>(value ?? "")

  React.useEffect(() => {
    if (mode === "custom") {
      onChange(custom)
    } else {
      const key = mode as Exclude<PresetKey, "custom">
      onChange(PRESETS[key].join("\n"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-sm">
        {(["wasd","arrows","touch","custom"] as PresetKey[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`rounded border px-2 py-1 ${mode===k?"bg-neutral-100":""}`}
            onClick={() => setMode(k)}
          >{k}</button>
        ))}
      </div>
      {mode === "custom" ? (
        <textarea
          className="w-full min-h-[100px] rounded border p-2 text-sm"
          placeholder="One control per line, e.g.\nSpace: Jump\nE: Interact"
          value={custom}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setCustom(e.target.value); onChange(e.target.value) }}
        />
      ) : (
        <pre className="whitespace-pre-wrap rounded border p-2 text-sm bg-neutral-50">{PRESETS[mode as Exclude<PresetKey, "custom">].join("\n")}</pre>
      )}
    </div>
  )
}
