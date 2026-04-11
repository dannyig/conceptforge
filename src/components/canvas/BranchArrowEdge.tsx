import React from 'react'
import { BaseEdge, getStraightPath, useInternalNode, type EdgeProps } from '@xyflow/react'
import { COLOR_EDGE, COLOR_EDGE_SELECTED } from '@/lib/theme'
import { rectBoundaryPoint } from '@/lib/geometry'

// C-11: arrow from the label hub → a target node. Arrow only — no label editing.
// The hub attachment point is computed as the free-form boundary intersection — the exact
// point on the hub rectangle boundary that faces the target node (C-11, C-17).
export function BranchArrowEdge({
  id,
  targetX,
  targetY,
  markerEnd,
  selected,
  data,
}: EdgeProps): React.JSX.Element {
  const beId = (data as { branchingEdgeId?: string } | undefined)?.branchingEdgeId
  const hubNode = useInternalNode(beId ? `hub-${beId}` : '')
  const isHovered = (data as { isHovered?: boolean } | undefined)?.isHovered

  let startX = targetX
  let startY = targetY

  if (hubNode) {
    const w = hubNode.measured.width ?? 0
    const h = hubNode.measured.height ?? 0
    const cx = hubNode.internals.positionAbsolute.x + w / 2
    const cy = hubNode.internals.positionAbsolute.y + h / 2
    const pt = rectBoundaryPoint(cx, cy, w / 2, h / 2, targetX, targetY)
    startX = pt.x
    startY = pt.y
  }

  const [edgePath] = getStraightPath({ sourceX: startX, sourceY: startY, targetX, targetY })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: selected || isHovered ? COLOR_EDGE_SELECTED : COLOR_EDGE,
        strokeWidth: 1.5,
      }}
    />
  )
}
