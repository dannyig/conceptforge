import React from 'react'
import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react'
import { COLOR_EDGE } from '@/lib/theme'

// The straight stem from source node → label hub. No arrowhead, no label editing.
export function BranchStemEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps): React.JSX.Element {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return <BaseEdge id={id} path={edgePath} style={{ stroke: COLOR_EDGE, strokeWidth: 1.5 }} />
}
