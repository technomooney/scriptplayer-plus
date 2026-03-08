import { useRef, useEffect, useCallback } from 'react'
import { FunscriptAction } from '../types'
import { getSpeed } from '../services/funscript'

interface ScriptHeatmapProps {
  actions: FunscriptAction[]
  duration: number // seconds
  currentTime: number // seconds
  onSeek: (time: number) => void
}

const COLORS = [
  [30, 144, 30],    // slow - green
  [160, 200, 50],   // medium-slow - yellow-green
  [240, 200, 50],   // medium - yellow
  [245, 160, 50],   // medium-fast - orange
  [240, 80, 50],    // fast - red-orange
  [200, 30, 60],    // very fast - deep red
  [160, 20, 100],   // extreme - purple-red
]

function speedToColor(speed: number): string {
  // Map speed (0-500+) to color index
  const t = Math.min(speed / 400, 1)
  const idx = t * (COLORS.length - 1)
  const low = Math.floor(idx)
  const high = Math.min(low + 1, COLORS.length - 1)
  const frac = idx - low
  const r = Math.round(COLORS[low][0] + (COLORS[high][0] - COLORS[low][0]) * frac)
  const g = Math.round(COLORS[low][1] + (COLORS[high][1] - COLORS[low][1]) * frac)
  const b = Math.round(COLORS[low][2] + (COLORS[high][2] - COLORS[low][2]) * frac)
  return `rgb(${r},${g},${b})`
}

export default function ScriptHeatmap({
  actions,
  duration,
  currentTime,
  onSeek,
}: ScriptHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || actions.length < 2 || duration <= 0) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const durationMs = duration * 1000

    // Background
    ctx.fillStyle = '#11111b'
    ctx.fillRect(0, 0, w, h)

    // Draw heatmap bars
    const barWidth = Math.max(1, w / 200) // ~200 segments across
    const segmentMs = durationMs / Math.floor(w / barWidth)

    for (let i = 0; i < Math.floor(w / barWidth); i++) {
      const segStart = i * segmentMs
      const segEnd = segStart + segmentMs

      // Find actions in this segment and calculate average speed
      let totalSpeed = 0
      let count = 0
      for (let j = 0; j < actions.length - 1; j++) {
        const a = actions[j]
        const b = actions[j + 1]
        // Check if this action pair overlaps with segment
        if (b.at < segStart || a.at > segEnd) continue
        totalSpeed += getSpeed(a, b)
        count++
      }

      if (count > 0) {
        const avgSpeed = totalSpeed / count
        ctx.fillStyle = speedToColor(avgSpeed)
      } else {
        ctx.fillStyle = '#1e1e2e'
      }

      const x = i * barWidth
      ctx.fillRect(x, 0, barWidth, h)
    }

    // Draw position indicator
    const posX = (currentTime / duration) * w
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(posX - 1, 0, 2, h)

    // Glow around position
    const glow = ctx.createLinearGradient(posX - 8, 0, posX + 8, 0)
    glow.addColorStop(0, 'transparent')
    glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(posX - 8, 0, 16, h)
  }, [actions, duration, currentTime])

  useEffect(() => {
    const frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => draw())
    observer.observe(container)
    return () => observer.disconnect()
  }, [draw])

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || duration <= 0) return
    const x = e.clientX - rect.left
    const time = (x / rect.width) * duration
    onSeek(Math.max(0, Math.min(duration, time)))
  }

  return (
    <div ref={containerRef} className="w-full h-full cursor-pointer" onClick={handleClick}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
