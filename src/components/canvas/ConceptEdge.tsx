import React, { useCallback, useRef, useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import {
  COLOR_EDGE_SELECTED,
  COLOR_NODE_BG,
  COLOR_NODE_TEXT,
  FONT_FAMILY,
  FONT_SIZE_NODE_LABEL,
  FONT_WEIGHT_NODE_LABEL,
  TRANSITION_FAST,
} from '@/lib/theme'

export type EdgeData = { label?: string }
export type ConceptFlowEdge = Edge<EdgeData>

export function ConceptEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
  selected,
}: EdgeProps<ConceptFlowEdge>): React.JSX.Element {
  const { setEdges } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data?.label ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const startEdit = useCallback((): void => {
    setDraft(data?.label ?? '')
    setEditing(true)
    setTimeout((): void => inputRef.current?.select(), 0)
  }, [data?.label])

  const confirmEdit = useCallback((): void => {
    const trimmed = draft.trim()
    setEdges(eds => eds.map(e => (e.id === id ? { ...e, data: { ...e.data, label: trimmed } } : e)))
    setEditing(false)
  }, [id, draft, setEdges])

  const cancelEdit = useCallback((): void => {
    setDraft(data?.label ?? '')
    setEditing(false)
  }, [data?.label])

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') confirmEdit()
      if (e.key === 'Escape') cancelEdit()
      // Prevent React Flow from handling Backspace/Delete during label editing
      e.stopPropagation()
    },
    [confirmEdit, cancelEdit]
  )

  const label = data?.label

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          onDoubleClick={startEdit}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          aria-label={
            editing
              ? 'Editing edge label'
              : label
                ? `Edge label: ${label}`
                : 'Double-click to add edge label'
          }
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e): void => setDraft(e.target.value)}
              onBlur={confirmEdit}
              onKeyDown={onInputKeyDown}
              autoFocus
              aria-label="Edit edge label"
              style={{
                background: COLOR_NODE_BG,
                border: `1px solid ${COLOR_EDGE_SELECTED}`,
                borderRadius: 3,
                color: COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                fontWeight: FONT_WEIGHT_NODE_LABEL,
                padding: '1px 6px',
                outline: 'none',
                minWidth: 60,
                textAlign: 'center',
              }}
            />
          ) : label ? (
            <span
              style={{
                background: COLOR_NODE_BG,
                borderRadius: 3,
                color: selected ? COLOR_EDGE_SELECTED : COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                fontWeight: FONT_WEIGHT_NODE_LABEL,
                padding: '1px 6px',
                cursor: 'default',
                userSelect: 'none',
                transition: `color ${TRANSITION_FAST}`,
              }}
            >
              {label}
            </span>
          ) : (
            // Invisible hit target on unlabelled edges — allows double-click to add a label (C-09)
            <span
              aria-hidden="true"
              style={{ display: 'block', width: 20, height: 20, cursor: 'crosshair' }}
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
