import { Funscript, FunscriptBundle, ScriptAxisId } from '../types'

export type ScriptAxisKind = 'linear' | 'rotate' | 'scalar'

export interface ScriptAxisDefinition {
  id: ScriptAxisId
  label: string
  description: string
  kind: ScriptAxisKind
  suffixes: string[]
  defaultValue: number
}

export const SCRIPT_AXIS_DEFINITIONS: ScriptAxisDefinition[] = [
  { id: 'L0', label: 'L0', description: 'Stroke', kind: 'linear', suffixes: ['', 'stroke', 'l0'], defaultValue: 0.5 },
  { id: 'L1', label: 'L1', description: 'Surge', kind: 'linear', suffixes: ['surge', 'l1'], defaultValue: 0.5 },
  { id: 'L2', label: 'L2', description: 'Sway', kind: 'linear', suffixes: ['sway', 'l2'], defaultValue: 0.5 },
  { id: 'R0', label: 'R0', description: 'Twist', kind: 'rotate', suffixes: ['twist', 'r0'], defaultValue: 0.5 },
  { id: 'R1', label: 'R1', description: 'Roll', kind: 'rotate', suffixes: ['roll', 'r1'], defaultValue: 0.5 },
  { id: 'R2', label: 'R2', description: 'Pitch', kind: 'rotate', suffixes: ['pitch', 'r2'], defaultValue: 0.5 },
  { id: 'V0', label: 'V0', description: 'Vibrate', kind: 'scalar', suffixes: ['vib', 'vibe', 'v0'], defaultValue: 0 },
  { id: 'V1', label: 'V1', description: 'Pump', kind: 'scalar', suffixes: ['pump', 'v1'], defaultValue: 0 },
  { id: 'A0', label: 'A0', description: 'Valve', kind: 'scalar', suffixes: ['valve', 'a0'], defaultValue: 0 },
  { id: 'A1', label: 'A1', description: 'Suction', kind: 'scalar', suffixes: ['suck', 'suction', 'a1'], defaultValue: 0 },
  { id: 'A2', label: 'A2', description: 'Lube', kind: 'scalar', suffixes: ['lube', 'a2'], defaultValue: 0 },
]

export const SCRIPT_AXIS_IDS = SCRIPT_AXIS_DEFINITIONS.map((definition) => definition.id)

const axisDefinitionMap = new Map<ScriptAxisId, ScriptAxisDefinition>(
  SCRIPT_AXIS_DEFINITIONS.map((definition) => [definition.id, definition])
)

export function getScriptAxisDefinition(axisId: ScriptAxisId): ScriptAxisDefinition {
  return axisDefinitionMap.get(axisId)!
}

export function getDefaultAxisValue(axisId: ScriptAxisId): number {
  return getScriptAxisDefinition(axisId).defaultValue
}

export function stripKnownAxisSuffix(stem: string): string {
  const normalizedStem = stem.trim().toLowerCase()
  for (const definition of SCRIPT_AXIS_DEFINITIONS) {
    for (const suffix of definition.suffixes) {
      if (!suffix) continue
      if (normalizedStem === suffix) return ''
      const dotted = `.${suffix}`
      if (normalizedStem.endsWith(dotted)) {
        return normalizedStem.slice(0, -dotted.length)
      }
    }
  }

  return normalizedStem
}

export function inferAxisIdFromStem(stem: string): ScriptAxisId | null {
  const normalizedStem = stem.trim().toLowerCase()
  if (!normalizedStem) return 'L0'

  for (const definition of SCRIPT_AXIS_DEFINITIONS) {
    for (const suffix of definition.suffixes) {
      if (!suffix) continue
      if (normalizedStem === suffix || normalizedStem.endsWith(`.${suffix}`)) {
        return definition.id
      }
    }
  }

  return null
}

export function normalizeScriptBundle(raw: unknown): FunscriptBundle | null {
  if (!raw || typeof raw !== 'object') return null

  const scripts = (raw as any).scripts
  const sources = (raw as any).sources
  const primaryAxis = (raw as any).primaryAxis

  return {
    primaryAxis: typeof primaryAxis === 'string' ? (primaryAxis as ScriptAxisId) : null,
    scripts: normalizeScriptMap(scripts),
    sources: normalizeSourceMap(sources),
  }
}

function normalizeScriptMap(raw: unknown): Partial<Record<ScriptAxisId, Funscript>> {
  if (!raw || typeof raw !== 'object') return {}

  const next: Partial<Record<ScriptAxisId, Funscript>> = {}
  for (const axisId of SCRIPT_AXIS_IDS) {
    const value = (raw as Record<string, unknown>)[axisId]
    if (value && typeof value === 'object') {
      next[axisId] = value as Funscript
    }
  }
  return next
}

function normalizeSourceMap(raw: unknown): Partial<Record<ScriptAxisId, string>> {
  if (!raw || typeof raw !== 'object') return {}

  const next: Partial<Record<ScriptAxisId, string>> = {}
  for (const axisId of SCRIPT_AXIS_IDS) {
    const value = (raw as Record<string, unknown>)[axisId]
    if (typeof value === 'string') {
      next[axisId] = value
    }
  }
  return next
}
