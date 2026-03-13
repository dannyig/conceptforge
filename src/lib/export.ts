import type { BranchingEdge, ConceptEdge, ConceptNode, MapData } from '@/types'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function saveMapToJson(data: MapData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `conceptforge-map-${todayString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function loadMapFromJson(): Promise<MapData> {
  return new Promise<MapData>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (): void => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const reader = new FileReader()
      reader.onload = (): void => {
        try {
          const raw: unknown = JSON.parse(reader.result as string)
          resolve(validateMapData(raw))
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = (): void => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    input.click()
  })
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function assertNode(val: unknown): ConceptNode {
  if (!isObject(val)) throw new Error('Invalid map file')
  if (typeof val.id !== 'string') throw new Error('Invalid map file')
  if (typeof val.label !== 'string') throw new Error('Invalid map file')
  if (!isObject(val.position)) throw new Error('Invalid map file')
  if (typeof val.position.x !== 'number') throw new Error('Invalid map file')
  if (typeof val.position.y !== 'number') throw new Error('Invalid map file')
  const validTypes = new Set(['concept', 'question', 'source', 'insight', undefined])
  if (!validTypes.has(val.type as string | undefined)) throw new Error('Invalid map file')
  return val as unknown as ConceptNode
}

function assertEdge(val: unknown): ConceptEdge {
  if (!isObject(val)) throw new Error('Invalid map file')
  if (typeof val.id !== 'string') throw new Error('Invalid map file')
  if (typeof val.source !== 'string') throw new Error('Invalid map file')
  if (typeof val.target !== 'string') throw new Error('Invalid map file')
  if (val.label !== undefined && typeof val.label !== 'string') throw new Error('Invalid map file')
  if (val.labelPosition !== undefined) {
    if (!isObject(val.labelPosition)) throw new Error('Invalid map file')
    if (typeof val.labelPosition.x !== 'number') throw new Error('Invalid map file')
    if (typeof val.labelPosition.y !== 'number') throw new Error('Invalid map file')
  }
  return val as unknown as ConceptEdge
}

function assertBranchingEdge(val: unknown): BranchingEdge {
  if (!isObject(val)) throw new Error('Invalid map file')
  if (typeof val.id !== 'string') throw new Error('Invalid map file')
  if (typeof val.source !== 'string') throw new Error('Invalid map file')
  if (typeof val.label !== 'string') throw new Error('Invalid map file')
  if (!Array.isArray(val.targets)) throw new Error('Invalid map file')
  for (const t of val.targets) {
    if (typeof t !== 'string') throw new Error('Invalid map file')
  }
  if (val.labelPosition !== undefined) {
    if (!isObject(val.labelPosition)) throw new Error('Invalid map file')
    if (typeof val.labelPosition.x !== 'number') throw new Error('Invalid map file')
    if (typeof val.labelPosition.y !== 'number') throw new Error('Invalid map file')
  }
  return val as unknown as BranchingEdge
}

export function validateMapData(raw: unknown): MapData {
  if (!isObject(raw)) throw new Error('Invalid map file')
  if (!Array.isArray(raw.nodes)) throw new Error('Invalid map file')
  if (!Array.isArray(raw.edges)) throw new Error('Invalid map file')

  const nodes: ConceptNode[] = raw.nodes.map(assertNode)
  const edges: ConceptEdge[] = raw.edges.map(assertEdge)

  if (raw.focusQuestion !== undefined && typeof raw.focusQuestion !== 'string') {
    throw new Error('Invalid map file')
  }

  let branchingEdges: BranchingEdge[] | undefined
  if (raw.branchingEdges !== undefined) {
    if (!Array.isArray(raw.branchingEdges)) throw new Error('Invalid map file')
    branchingEdges = raw.branchingEdges.map(assertBranchingEdge)
  }

  return {
    nodes,
    edges,
    ...(branchingEdges !== undefined ? { branchingEdges } : {}),
    ...(typeof raw.focusQuestion === 'string' ? { focusQuestion: raw.focusQuestion } : {}),
  }
}

export async function exportCanvasToPng(): Promise<void> {
  throw new Error('Not implemented — Persistence Agent will implement this')
}
