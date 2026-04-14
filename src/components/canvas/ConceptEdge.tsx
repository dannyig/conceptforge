import React, { useCallback, useRef, useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useInternalNode,
  useReactFlow,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import { rectBoundaryPoint } from '@/lib/geometry'
import { useTheme } from '@/hooks/use-theme'
import {
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
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
  style,
  selected,
}: EdgeProps<ConceptFlowEdge>): React.JSX.Element {
  const { tokens } = useTheme()
  const { setEdges, screenToFlowPosition } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data?.label ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const dragging = useRef(false)

  // C-18 / C-41 / C-42: compute floating boundary intersection points so edges always
  // attach at the exact boundary point nearest to the opposite node (or to the label
  // waypoint when the label has been repositioned). This makes edges dynamic — they
  // reposition automatically when nodes move, and handle values ("left", "top", etc.)
  // stored in old maps are rendered correctly without any migration step (C-42).
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  const customPos = data?.labelPosition

  // The "toward" point for the source boundary: the label waypoint if repositioned,
  // otherwise the target node center (or the RF handle position as a fallback).
  const towardFromSource = customPos
    ? customPos
    : targetNode
      ? {
          x: targetNode.internals.positionAbsolute.x + (targetNode.measured.width ?? 0) / 2,
          y: targetNode.internals.positionAbsolute.y + (targetNode.measured.height ?? 0) / 2,
        }
      : { x: targetX, y: targetY }

  // The "toward" point for the target boundary: the label waypoint if repositioned,
  // otherwise the source node center (or the RF handle position as a fallback).
  const towardFromTarget = customPos
    ? customPos
    : sourceNode
      ? {
          x: sourceNode.internals.positionAbsolute.x + (sourceNode.measured.width ?? 0) / 2,
          y: sourceNode.internals.positionAbsolute.y + (sourceNode.measured.height ?? 0) / 2,
        }
      : { x: sourceX, y: sourceY }

  let sx = sourceX
  let sy = sourceY
  if (sourceNode) {
    const sw = sourceNode.measured.width ?? 0
    const sh = sourceNode.measured.height ?? 0
    const scx = sourceNode.internals.positionAbsolute.x + sw / 2
    const scy = sourceNode.internals.positionAbsolute.y + sh / 2
    const pt = rectBoundaryPoint(scx, scy, sw / 2, sh / 2, towardFromSource.x, towardFromSource.y)
    sx = pt.x
    sy = pt.y
  }

  let tx = targetX
  let ty = targetY
  if (targetNode) {
    const tw = targetNode.measured.width ?? 0
    const th = targetNode.measured.height ?? 0
    const tcx = targetNode.internals.positionAbsolute.x + tw / 2
    const tcy = targetNode.internals.positionAbsolute.y + th / 2
    const pt = rectBoundaryPoint(tcx, tcy, tw / 2, th / 2, towardFromTarget.x, towardFromTarget.y)
    tx = pt.x
    ty = pt.y
  }

  // Resolve label position: custom waypoint or midpoint of the boundary-computed path
  const [defaultPath, defaultLabelX, defaultLabelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  })
  const labelX = customPos ? customPos.x : defaultLabelX
  const labelY = customPos ? customPos.y : defaultLabelY

  // Two-segment paths used when label has been repositioned (C-21)
  const [stemPath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: labelX,
    targetY: labelY,
  })
  const [arrowPath] = getStraightPath({
    sourceX: labelX,
    sourceY: labelY,
    targetX: tx,
    targetY: ty,
  })

  const startEdit = useCallback((): void => {
    setDraft(data?.label ?? '')
    setEditing(true)
    setTimeout((): void => inputRef.current?.select(), 0)
  }, [data?.label])

  const confirmEdit = useCallback((): void => {
    const trimmed = draft.trim() || '?'
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
          onDoubleClick={(e: React.MouseEvent): void => {
            // C-39: prevent React Flow pane zoom on edge label double-click
            e.stopPropagation()
            startEdit()
          }}
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
                background: tokens.COLOR_NODE_BG,
                border: `1px solid ${tokens.COLOR_EDGE_SELECTED}`,
                borderRadius: 3,
                color: tokens.COLOR_NODE_TEXT,
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
                background: tokens.COLOR_NODE_BG,
                borderRadius: 3,
                color:
                  selected || data?.isHovered ? tokens.COLOR_EDGE_SELECTED : tokens.COLOR_NODE_TEXT,
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
