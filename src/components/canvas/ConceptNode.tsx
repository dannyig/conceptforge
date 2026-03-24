import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { Handle, Position, useReactFlow, type Node, type NodeProps } from '@xyflow/react'
import {
  COLOR_NODE_BG,
  COLOR_NODE_BORDER,
  COLOR_NODE_GLOW,
  COLOR_NODE_INFO_DOT,
  COLOR_NODE_SELECTED,
  COLOR_NODE_TEXT,
  FONT_FAMILY,
  FONT_SIZE_NODE_LABEL,
  FONT_WEIGHT_NODE_LABEL,
  TRANSITION_NORMAL,
} from '@/lib/theme'

export type NodeData = {
  label: string
  conceptType?: 'concept' | 'question' | 'source' | 'insight'
  autoEdit?: boolean
  description?: string // C-28: short freeform description
}

export type ConceptFlowNode = Node<NodeData>

// All four sides — used to render source + target handle pairs.
// flushStyle offsets each handle inward by half its size so React Flow's
// outer-edge endpoint computation places edge start/end flush with the node border.
const HANDLE_SIZE = 8
const FLUSH = HANDLE_SIZE / 2
const SIDES = [
  { position: Position.Top, id: 'top', flushStyle: { top: FLUSH } },
  { position: Position.Right, id: 'right', flushStyle: { right: FLUSH } },
  { position: Position.Bottom, id: 'bottom', flushStyle: { bottom: FLUSH } },
  { position: Position.Left, id: 'left', flushStyle: { left: FLUSH } },
] as const

// Handles are always invisible per C-18
const HANDLE_STYLE_BASE: React.CSSProperties = {
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  opacity: 0,
}

export function ConceptNode({ id, data, selected }: NodeProps<ConceptFlowNode>): React.JSX.Element {
  const { setNodes } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const [hovered, setHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback((): void => {
    setDraft(data.label)
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }, [data.label])

  const confirmEdit = useCallback((): void => {
    const trimmed = draft.trim() || data.label
    setNodes(nds => nds.map(n => (n.id === id ? { ...n, data: { ...n.data, label: trimmed } } : n)))
    setEditing(false)
  }, [id, draft, data.label, setNodes])

  const cancelEdit = useCallback((): void => {
    setDraft(data.label)
    setEditing(false)
  }, [data.label])

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') confirmEdit()
      if (e.key === 'Escape') cancelEdit()
      // Prevent React Flow from handling Backspace/Delete during editing
      e.stopPropagation()
    },
    [confirmEdit, cancelEdit]
  )

  // C-19: if the node was created by edge-drop, enter blank edit mode on mount
  useEffect((): void => {
    if (data.autoEdit) {
      setDraft('')
      setEditing(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [])

  const borderColor = selected
    ? COLOR_NODE_SELECTED
    : hovered
      ? `${COLOR_NODE_SELECTED}99`
      : COLOR_NODE_BORDER

  const boxShadow = selected ? `0 0 0 3px ${COLOR_NODE_GLOW}` : 'none'

  const onNodeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (!editing && (e.key === 'Enter' || e.key === 'F2')) {
        e.preventDefault()
        startEdit()
      }
    },
    [editing, startEdit]
  )

  return (
    <div
      onDoubleClick={(e: React.MouseEvent): void => {
        // C-39: stop propagation so React Flow's pane zoom handler does not fire
        e.stopPropagation()
        startEdit()
      }}
      onKeyDown={onNodeKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: COLOR_NODE_BG,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        padding: '10px 16px',
        minWidth: 120,
        color: COLOR_NODE_TEXT,
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_NODE_LABEL,
        fontWeight: FONT_WEIGHT_NODE_LABEL,
        boxShadow,
        transition: `border-color ${TRANSITION_NORMAL}, box-shadow ${TRANSITION_NORMAL}`,
        cursor: 'default',
        userSelect: 'none',
        position: 'relative',
        textAlign: 'center',
      }}
      aria-label={editing ? `Editing node: ${data.label}` : `Node: ${data.label}`}
    >
      {/*
       * C-18: four handle pairs (source + target per side), all visually hidden.
       * Both source and target handles on every side are always connectable —
       * a handle may have incoming and outgoing edges simultaneously (C-18 update).
       * Source handles are rendered after target handles so they sit on top
       * in the DOM — React Flow's connection state machine handles priority
       * correctly (source active when idle, target active when dragging).
       */}
      {SIDES.map(({ position, id: side, flushStyle }) => (
        <React.Fragment key={side}>
          <Handle
            id={`${side}-t`}
            type="target"
            position={position}
            style={{ ...HANDLE_STYLE_BASE, ...flushStyle }}
            aria-label={`Connect to node (${side})`}
          />
          <Handle
            id={side}
            type="source"
            position={position}
            style={{ ...HANDLE_STYLE_BASE, ...flushStyle }}
            aria-label={`Connect from node (${side})`}
          />
        </React.Fragment>
      ))}

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={confirmEdit}
          onKeyDown={onInputKeyDown}
          autoFocus
          aria-label="Edit node label"
          style={{
            background: 'transparent',
            border: 'none',
            color: COLOR_NODE_TEXT,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_NODE_LABEL,
            fontWeight: FONT_WEIGHT_NODE_LABEL,
            width: '100%',
            padding: 0,
            cursor: 'text',
            textAlign: 'center',
          }}
        />
      ) : (
        <span>{data.label}</span>
      )}

      {/* C-29: green dot indicator — shown only when node has a description */}
      {data.description && (
        <div
          ref={dotRef}
          onMouseEnter={(): void => {
            const rect = dotRef.current?.getBoundingClientRect()
            if (rect) {
              setTooltipPos({ x: rect.right, y: rect.top })
            }
            setShowTooltip(true)
          }}
          onMouseLeave={(): void => setShowTooltip(false)}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: COLOR_NODE_INFO_DOT,
            pointerEvents: 'auto',
            zIndex: 10,
          }}
          aria-label="This node has a description"
        />
      )}

      {/* C-30: description tooltip — portalled to document.body so it clears all canvas stacking contexts */}
      {showTooltip &&
        tooltipPos !== null &&
        data.description &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: tooltipPos.y,
              left: tooltipPos.x + 8,
              transform: 'translateY(-100%)',
              backgroundColor: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 4,
              padding: '6px 10px',
              color: COLOR_NODE_TEXT,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_NODE_LABEL,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxWidth: 260,
              pointerEvents: 'none',
              zIndex: 99999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
            role="tooltip"
          >
            {data.description}
          </div>,
          document.body
        )}

      {/* All handles hidden — pseudo-class input focus styles */}
      <style>{`
        .react-flow__node-concept .react-flow__handle { opacity: 0 !important; }
        .react-flow__node input:focus-visible { outline: 1px solid ${COLOR_NODE_SELECTED}; outline-offset: 2px; border-radius: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .react-flow__handle { transition: none !important; }
        }
      `}</style>
    </div>
  )
}
