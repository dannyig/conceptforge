// Node layout utilities
import type { ConceptNode } from '@/types'

// Simple grid layout for initial map generation (A-02, A-03).
// Expansion positioning is handled in Canvas.tsx via fanPositions.
export function autoLayout(nodes: ConceptNode[]): ConceptNode[] {
  const COLS = Math.max(1, Math.ceil(Math.sqrt(nodes.length)))
  const X_GAP = 220
  const Y_GAP = 130
  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % COLS) * X_GAP,
      y: Math.floor(i / COLS) * Y_GAP,
    },
  }))
}
