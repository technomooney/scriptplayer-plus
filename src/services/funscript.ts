import { Funscript, FunscriptAction } from '../types'

export function parseFunscript(data: unknown): Funscript | null {
  try {
    const script = data as Funscript
    if (!script.actions || !Array.isArray(script.actions)) return null

    // Sort actions by time
    script.actions.sort((a, b) => a.at - b.at)

    // Clamp positions to 0-100
    script.actions = script.actions.map((a) => ({
      at: a.at,
      pos: Math.max(0, Math.min(100, a.pos)),
    }))

    return script
  } catch {
    return null
  }
}

/** Get the interpolated position at a given time */
export function getPositionAtTime(actions: FunscriptAction[], timeMs: number): number {
  if (actions.length === 0) return 50

  // Before first action
  if (timeMs <= actions[0].at) return actions[0].pos

  // After last action
  if (timeMs >= actions[actions.length - 1].at) return actions[actions.length - 1].pos

  // Binary search for the surrounding actions
  let low = 0
  let high = actions.length - 1

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2)
    if (actions[mid].at <= timeMs) {
      low = mid
    } else {
      high = mid
    }
  }

  const prev = actions[low]
  const next = actions[high]
  const progress = (timeMs - prev.at) / (next.at - prev.at)
  return prev.pos + (next.pos - prev.pos) * progress
}

/** Get actions within a time window for visualization */
export function getActionsInRange(
  actions: FunscriptAction[],
  startMs: number,
  endMs: number
): FunscriptAction[] {
  // Binary search for start index
  let startIdx = 0
  let low = 0
  let high = actions.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (actions[mid].at < startMs) {
      low = mid + 1
    } else {
      startIdx = mid
      high = mid - 1
    }
  }

  // Include one action before the range for line continuity
  if (startIdx > 0) startIdx--

  const result: FunscriptAction[] = []
  for (let i = startIdx; i < actions.length; i++) {
    if (actions[i].at > endMs) {
      result.push(actions[i]) // Include one after for line continuity
      break
    }
    result.push(actions[i])
  }

  return result
}

/** Calculate speed between two actions in units/sec */
export function getSpeed(a: FunscriptAction, b: FunscriptAction): number {
  const dt = Math.abs(b.at - a.at)
  if (dt === 0) return 0
  const dp = Math.abs(b.pos - a.pos)
  return (dp / dt) * 1000
}
