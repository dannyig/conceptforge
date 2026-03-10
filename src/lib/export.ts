// JSON save/load and PNG export — stub only
// Implemented by Persistence Agent (agentspecs/04-persistence-agent.md)
import type { MapData } from '@/types'

export function saveMapToJson(_data: MapData): void {
  throw new Error('Not implemented — Persistence Agent will implement this')
}

export async function loadMapFromJson(_file: File): Promise<MapData> {
  throw new Error('Not implemented — Persistence Agent will implement this')
}

export function validateMapData(_data: unknown): MapData {
  throw new Error('Not implemented — Persistence Agent will implement this')
}

export async function exportCanvasToPng(): Promise<void> {
  throw new Error('Not implemented — Persistence Agent will implement this')
}
