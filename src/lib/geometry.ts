// Shared geometry utilities for edge path computation

// Returns the point on the boundary of a rectangle (centered at cx, cy with half-dimensions
// hw, hh) that lies on the ray from the center toward (px, py).
// Used by ConceptEdge, BranchStemEdge, and BranchArrowEdge to compute floating boundary
// attachment points (C-18, C-41, C-42).
export function rectBoundaryPoint(
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  px: number,
  py: number
): { x: number; y: number } {
  const dx = px - cx
  const dy = py - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const tX = dx !== 0 ? hw / Math.abs(dx) : Infinity
  const tY = dy !== 0 ? hh / Math.abs(dy) : Infinity
  const t = Math.min(tX, tY)
  return { x: cx + t * dx, y: cy + t * dy }
}
