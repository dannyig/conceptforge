// Node layout utilities
import type { ConceptNode } from '@/types'

// A-24: approximate node bounding box used for clearance calculations
const NODE_W = 180 // px — wider than the visual node to absorb label overflow
const NODE_H = 60 // px

// A-24: hierarchical (BFS-based) layout for directed graphs.
// Nodes are arranged left-to-right by depth; each layer is centred vertically.
// Guarantees no two node bounding boxes overlap.
function hierarchicalLayout(
  nodes: ConceptNode[],
  edges: Array<{ source: string; target: string }>
): ConceptNode[] {
  const H_GAP = 80 // horizontal clearance between columns
  const V_GAP = 60 // vertical clearance between rows
  const COL_STRIDE = NODE_W + H_GAP
  const ROW_STRIDE = NODE_H + V_GAP

  const nodeIds = new Set(nodes.map(n => n.id))
  const children = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  for (const n of nodes) {
    children.set(n.id, [])
    inDegree.set(n.id, 0)
  }
  for (const e of edges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
      children.get(e.source)?.push(e.target)
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
    }
  }

  // Roots = nodes with no incoming edges; fallback to most-connected node
  let roots = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id)
  if (roots.length === 0) {
    const best = [...nodes].sort(
      (a, b) => (children.get(b.id)?.length ?? 0) - (children.get(a.id)?.length ?? 0)
    )
    roots = [best[0].id]
  }

  // BFS depth assignment
  const depth = new Map<string, number>()
  const queue = [...roots]
  for (const r of roots) depth.set(r, 0)
  let head = 0
  while (head < queue.length) {
    const id = queue[head++]
    const d = depth.get(id) ?? 0
    for (const child of children.get(id) ?? []) {
      if (!depth.has(child)) {
        depth.set(child, d + 1)
        queue.push(child)
      }
    }
  }
  // Nodes unreachable from roots (cycles) → max depth + 1
  const maxDepth = depth.size > 0 ? Math.max(...depth.values()) : 0
  for (const n of nodes) {
    if (!depth.has(n.id)) depth.set(n.id, maxDepth + 1)
  }

  // Group nodes by depth level
  const layers = new Map<number, string[]>()
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0
    if (!layers.has(d)) layers.set(d, [])
    layers.get(d)!.push(n.id)
  }

  // Assign positions: x by depth, y centred within each layer
  const posMap = new Map<string, { x: number; y: number }>()
  for (const [d, layer] of layers) {
    const x = d * COL_STRIDE
    const totalH = layer.length * ROW_STRIDE - V_GAP
    const startY = -totalH / 2
    layer.forEach((id, i) => {
      posMap.set(id, { x, y: Math.round(startY + i * ROW_STRIDE) })
    })
  }

  return nodes.map(n => ({ ...n, position: posMap.get(n.id) ?? { x: 0, y: 0 } }))
}

// Fallback: simple grid layout when no edge information is available
function gridLayout(nodes: ConceptNode[]): ConceptNode[] {
  const COLS = Math.max(1, Math.ceil(Math.sqrt(nodes.length)))
  const COL_STRIDE = NODE_W + 80
  const ROW_STRIDE = NODE_H + 60
  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % COLS) * COL_STRIDE,
      y: Math.floor(i / COLS) * ROW_STRIDE,
    },
  }))
}

// A-24: Non-overlapping layout for concept map nodes.
// Uses hierarchical BFS layout when edges are provided (Mode 1), grid fallback otherwise.
export function autoLayout(
  nodes: ConceptNode[],
  edges?: Array<{ source: string; target: string }>
): ConceptNode[] {
  if (nodes.length === 0) return nodes
  if (edges && edges.length > 0) return hierarchicalLayout(nodes, edges)
  return gridLayout(nodes)
}

// A-13: place new concept nodes in a ring around the outer area of the existing canvas content.
// Positions are evenly distributed on a circle whose radius clears all existing nodes.
export function ringPositions(
  existingNodes: ConceptNode[],
  count: number
): Array<{ x: number; y: number }> {
  if (count === 0) return []

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
