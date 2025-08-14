"use client"
import * as React from "react"

type Preset = { width: number; height: number }

export default function ImageCropper({
  file,
  preset,
  onChange,
  previewWidth = 480,
}: {
  file?: File | null
  preset: Preset
  onChange: (dataUrl: string | null) => void
  previewWidth?: number
}) {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = React.useState(1)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    if (!file) { setImg(null); onChange(null); return }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { setImg(image) }
    image.src = url
    return () => { URL.revokeObjectURL(url) }
  }, [file])

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext("2d")!
    canvas.width = preset.width
    canvas.height = preset.height
    ctx.clearRect(0,0,canvas.width,canvas.height)
    const scale = Math.max(
      preset.width / img.width,
      preset.height / img.height
    ) * zoom
    const dw = img.width * scale
    const dh = img.height * scale
    const dx = (canvas.width - dw) / 2 + offset.x
    const dy = (canvas.height - dh) / 2 + offset.y
    ctx.drawImage(img, dx, dy, dw, dh)
    onChange(canvas.toDataURL("image/jpeg", 0.9))
  }, [img, preset.width, preset.height, zoom, offset, onChange])

  React.useEffect(() => { draw() }, [draw])

  // Simple drag to move
  const dragging = React.useRef(false)
  const last = React.useRef({ x: 0, y: 0 })
  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; last.current = { x: e.clientX, y: e.clientY } }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
  setOffset((o: { x: number; y: number }) => ({ x: o.x + dx, y: o.y + dy }))
  }
  const onMouseUp = () => { dragging.current = false }

  const aspect = preset.width / preset.height
  const previewHeight = Math.round(previewWidth / aspect)

  return (
    <div className="space-y-2">
      <div
        className="relative inline-block overflow-hidden rounded border bg-neutral-50"
        style={{ width: previewWidth, height: previewHeight }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <canvas ref={canvasRef} className="block h-full w-full object-cover" />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoom(parseFloat(e.target.value))}
      />
    </div>
  )
}
