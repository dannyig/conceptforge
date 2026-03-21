import React, { useCallback, useRef, useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import {
  COLOR_EDGE_SELECTED,
  COLOR_NODE_BG,
  COLOR_NODE_TEXT,
  FONT_FAMILY,
  FONT_SIZE_EDGE_LABEL,
  FONT_SIZE_NODE_LABEL,
  FONT_WEIGHT_NODE_LABEL,
  TRANSITION_FAST,
} from '@/lib/theme'

export type EdgeData = {
  label?: string
  labelPosition?: { x: number; y: number }
  isHovered?: boolean // C-32: set by Canvas when cursor is over this edge
}
export type ConceptFlowEdge = Edge<EdgeData>

export function ConceptEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
  style,
  selected,
}: EdgeProps<ConceptFlowEdge>): React.JSX.Element {
  const { setEdges, screenToFlowPosition } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data?.label ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const dragging = useRef(false)

  // Resolve label position: custom waypoint or default midpoint (C-20, C-21)
  const customPos = data?.labelPosition
  const [defaultPath, defaultLabelX, defaultLabelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })
  const labelX = customPos ? customPos.x : defaultLabelX
  const labelY = customPos ? customPos.y : defaultLabelY

  // Two-segment paths used when label has been repositioned (C-21)
  const [stemPath] = getStraightPath({
    sourceX,
    sourceY,
    targetX: labelX,
    targetY: labelY,
  })
  const [arrowPath] = getStraightPath({
    sourceX: labelX,
    sourceY: labelY,
    targetX,
    targetY,
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

  // Drag to reposition the label waypoint (C-20)
  const onLabelMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      if (!data?.label || editing) return
      e.stopPropagation()
      e.preventDefault()
      dragging.current = true

      const onMouseMove = (ev: MouseEvent): void => {
        if (!dragging.current) return
        const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
        setEdges(eds =>
          eds.map(edge =>
            edge.id === id ? { ...edge, data: { ...edge.data, labelPosition: pos } } : edge
          )
        )
      }

      const onMouseUp = (): void => {
        dragging.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [id, data?.label, editing, screenToFlowPosition, setEdges]
  )

  const label = data?.label

  return (
    <>
      {customPos ? (
        // C-21: two-segment routing — stem (no arrow) then arrow segment
        <>
          <BaseEdge id={`${id}-stem`} path={stemPath} style={style} />
          <BaseEdge id={`${id}-arrow`} path={arrowPath} markerEnd={markerEnd} style={style} />
        </>
      ) : (
        <BaseEdge id={id} path={defaultPath} markerEnd={markerEnd} style={style} />
      )}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          onDoubleClick={startEdit}
          onMouseDown={label && !editing ? onLabelMouseDown : undefined}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            cursor: label && !editing ? 'grab' : 'default',
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
                cursor: 'text',
              }}
            />
          ) : label ? (
            <span
              style={{
                background: COLOR_NODE_BG,
                borderRadius: 3,
                color: selected || data?.isHovered ? COLOR_EDGE_SELECTED : COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_EDGE_LABEL,
                fontWeight: FONT_WEIGHT_NODE_LABEL,
                padding: '1px 6px',
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
