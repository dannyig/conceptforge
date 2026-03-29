import type { BranchingEdge, ConceptEdge, ConceptNode, MapData, NoteData } from '@/types'

// Minimal local types for the File System Access API (not in standard TS lib)
interface FileSystemWritableFileStream {
  write(data: string): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  name: string
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{ description?: string; accept: Record<string, string[]> }>
}

type WindowWithPicker = Window & {
  showSaveFilePicker?: (opts: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>
}

// P-08: detect native save-file dialog support (File System Access API)
export function hasNativeSavePicker(): boolean {
  return typeof (window as WindowWithPicker).showSaveFilePicker === 'function'
}

// P-08: native save-file dialog — user picks folder and filename in OS dialog.
// suggestedFilename should be the bare name WITHOUT .json extension.
// Returns the saved filename WITHOUT .json extension (for session pre-population).
// Throws DOMException with name 'AbortError' if the user cancels the dialog.
export async function saveMapToJsonNative(
  data: MapData,
  suggestedFilename: string
): Promise<string> {
  const json = JSON.stringify(data, null, 2)
  const picker = (window as WindowWithPicker).showSaveFilePicker!
  const handle = await picker({
    suggestedName: `${suggestedFilename}.json`,
    types: [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }],
  })
  const writable = await handle.createWritable()
  await writable.write(json)
  await writable.close()
  // Strip .json extension so the bare name is stored for next-save pre-population
  return handle.name.replace(/\.json$/i, '')
}

// P-09 fallback: standard browser download — used when showSaveFilePicker is unavailable.
export function saveMapToJson(data: MapData, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
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
  // P-07: description is optional — accept string or absent; reject any other type
  if (val.description !== undefined && typeof val.description !== 'string')
    throw new Error('Invalid map file')
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

function assertNote(val: unknown): NoteData {
  if (!isObject(val)) throw new Error('Invalid map file')
  if (typeof val.id !== 'string') throw new Error('Invalid map file')
  if (!isObject(val.position)) throw new Error('Invalid map file')
  if (typeof val.position.x !== 'number') throw new Error('Invalid map file')
  if (typeof val.position.y !== 'number') throw new Error('Invalid map file')
  if (typeof val.width !== 'number') throw new Error('Invalid map file')
  if (typeof val.height !== 'number') throw new Error('Invalid map file')
  if (typeof val.backgroundColor !== 'string') throw new Error('Invalid map file')
  if (val.text !== undefined && typeof val.text !== 'string') throw new Error('Invalid map file')
  const validSizes = new Set(['small', 'medium', 'large', undefined])
  if (!validSizes.has(val.textSize as string | undefined)) throw new Error('Invalid map file')
  return val as unknown as NoteData
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

  let notes: NoteData[] | undefined
  if (raw.notes !== undefined) {
    if (!Array.isArray(raw.notes)) throw new Error('Invalid map file')
    notes = raw.notes.map(assertNote)
  }

  return {
    nodes,
    edges,
    ...(branchingEdges !== undefined ? { branchingEdges } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(typeof raw.focusQuestion === 'string' ? { focusQuestion: raw.focusQuestion } : {}),
  }
}

export async function exportCanvasToPng(): Promise<void> {
  throw new Error('Not implemented — Persistence Agent will implement this')
}
