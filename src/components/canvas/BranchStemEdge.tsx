import React from 'react'
import { BaseEdge, getStraightPath, useInternalNode, type EdgeProps } from '@xyflow/react'
import { COLOR_EDGE } from '@/lib/theme'
import { rectBoundaryPoint } from '@/lib/geometry'

// C-11: straight stem from source node → label hub. No arrowhead, no label editing.
// The hub attachment point is computed as the free-form boundary intersection — the exact
// point on the hub rectangle boundary that faces the source node (C-11, C-17).
export function BranchStemEdge({ id, sourceX, sourceY, data }: EdgeProps): React.JSX.Element {
  const beId = (data as { branchingEdgeId?: string } | undefined)?.branchingEdgeId
  const hubNode = useInternalNode(beId ? `hub-${beId}` : '')

  let endX = sourceX
  let endY = sourceY

  if (hubNode) {
    const w = hubNode.measured.width ?? 0
    const h = hubNode.measured.height ?? 0
    const cx = hubNode.internals.positionAbsolute.x + w / 2
    const cy = hubNode.internals.positionAbsolute.y + h / 2
    const pt = rectBoundaryPoint(cx, cy, w / 2, h / 2, sourceX, sourceY)
    endX = pt.x
    endY = pt.y
  }

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX: endX, targetY: endY })
  return <BaseEdge id={id} path={edgePath} style={{ stroke: COLOR_EDGE, strokeWidth: 1.5 }} />
}
