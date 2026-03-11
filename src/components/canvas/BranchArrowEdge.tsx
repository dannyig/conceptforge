import React from 'react'
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import { COLOR_EDGE, COLOR_EDGE_SELECTED } from '@/lib/theme'

// A branch arrow from the hub → a target node. Arrow only — no label editing.
export function BranchArrowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
}: EdgeProps): React.JSX.Element {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: selected ? COLOR_EDGE_SELECTED : COLOR_EDGE,
        strokeWidth: 1.5,
      }}
    />
  )
}
