import React from 'react'
import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react'
import { COLOR_EDGE, COLOR_EDGE_SELECTED } from '@/lib/theme'

// A branch arrow from the hub → a target node. Arrow only — no label editing.
export function BranchArrowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  selected,
  data,
}: EdgeProps): React.JSX.Element {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const isHovered = (data as { isHovered?: boolean } | undefined)?.isHovered

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
