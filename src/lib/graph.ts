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

// A-13: place new concept nodes in a ring around the outer area of the existing canvas content.
// Positions are evenly distributed on a circle whose radius clears all existing nodes.
export function ringPositions(
  existingNodes: ConceptNode[],
  count: number
): Array<{ x: number; y: number }> {
  if (count === 0) return []

  const NODE_W = 160 // approximate node width in canvas units
  const NODE_H = 60 // approximate node height in canvas units
  const MIN_RADIUS = 320
  const PADDING = 280 // clearance beyond the bounding box edge

  let cx = 0
  let cy = 0
  let radius = MIN_RADIUS

  if (existingNodes.length > 0) {
    const xs = existingNodes.map(n => n.position.x)
    const ys = existingNodes.map(n => n.position.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs) + NODE_W
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys) + NODE_H
    cx = (minX + maxX) / 2
    cy = (minY + maxY) / 2
    const halfW = (maxX - minX) / 2
    const halfH = (maxY - minY) / 2
    radius = Math.max(MIN_RADIUS, Math.sqrt(halfW * halfW + halfH * halfH) + PADDING)
  }

  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(cx + radius * Math.cos((2 * Math.PI * i) / count)),
    y: Math.round(cy + radius * Math.sin((2 * Math.PI * i) / count)),
  }))
}
