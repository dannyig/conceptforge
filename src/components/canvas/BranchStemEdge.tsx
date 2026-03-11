import React from 'react'
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import { COLOR_EDGE } from '@/lib/theme'

// The straight stem from source node → label hub. No arrowhead, no label editing.
export function BranchStemEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps): React.JSX.Element {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return <BaseEdge id={id} path={edgePath} style={{ stroke: COLOR_EDGE, strokeWidth: 1.5 }} />
}
