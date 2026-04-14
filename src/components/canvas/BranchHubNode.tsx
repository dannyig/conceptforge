import React, { useCallback, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { useTheme } from '@/hooks/use-theme'
import {
  FONT_FAMILY,
  FONT_SIZE_EDGE_LABEL,
  FONT_WEIGHT_NODE_LABEL,
  TRANSITION_FAST,
} from '@/lib/theme'

// C-11: all handles distributed around the full hub boundary.
// Source handles (outgoing branch arrows) are hidden by default and revealed on hover (C-12).
// Target handles (incoming stem) are always hidden — stems are connected programmatically.
const HUB_HANDLE_SIZE = 8
const HUB_FLUSH = HUB_HANDLE_SIZE / 2

const HUB_SIDES = [
  { position: Position.Top, id: 'hub-top', flushStyle: { top: HUB_FLUSH } },
  { position: Position.Right, id: 'hub-right', flushStyle: { right: HUB_FLUSH } },
  { position: Position.Bottom, id: 'hub-bottom', flushStyle: { bottom: HUB_FLUSH } },
  { position: Position.Left, id: 'hub-left', flushStyle: { left: HUB_FLUSH } },
] as const

const HUB_HANDLE_BASE: React.CSSProperties = {
  width: HUB_HANDLE_SIZE,
  height: HUB_HANDLE_SIZE,
}

// BranchHubNode renders the shared relationship label hub for a branching edge (C-11, C-12, C-17).
// The hub is a draggable React Flow node — React Flow handles position/drag natively.
export function BranchHubNode({ id, data: rawData, selected }: NodeProps): React.JSX.Element {
  const { tokens } = useTheme()
  const data = rawData as { label: string; branchingEdgeId: string }
  const { setNodes, setEdges } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback((): void => {
    setDraft(data.label)
    setEditing(true)
    setTimeout((): void => inputRef.current?.select(), 0)
  }, [data.label])

  const confirmEdit = useCallback((): void => {
    const trimmed = draft.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }
    setNodes(nds => nds.map(n => (n.id === id ? { ...n, data: { ...n.data, label: trimmed } } : n)))
    // Sync label into branch edges' data so getMapData captures the latest value
    setEdges(eds =>
      eds.map(e =>
        e.data?.branchingEdgeId === data.branchingEdgeId && e.data?.isBranch
          ? { ...e, data: { ...e.data } }
          : e
      )
    )
    setEditing(false)
  }, [id, draft, data.branchingEdgeId, setNodes, setEdges])

  const cancelEdit = useCallback((): void => {
    setDraft(data.label)
    setEditing(false)
  }, [data.label])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') confirmEdit()
      if (e.key === 'Escape') cancelEdit()
      e.stopPropagation()
    },
    [confirmEdit, cancelEdit]
  )

  return (
    <>
      {/* C-11: four handle pairs per side — target handles always hidden (stem is programmatic),
          source handles hidden by default and revealed on hub hover (C-12). */}
      {HUB_SIDES.map(({ position, id: side, flushStyle }) => (
        <React.Fragment key={side}>
          <Handle
            id={`${side}-t`}
            type="target"
            position={position}
            style={{ ...HUB_HANDLE_BASE, ...flushStyle, opacity: 0, pointerEvents: 'none' }}
          />
          <Handle
            id={`${side}-s`}
            type="source"
            position={position}
            className="hub-source-handle"
            style={{
              ...HUB_HANDLE_BASE,
              ...flushStyle,
              background: tokens.COLOR_HANDLE,
              border: `1px solid ${tokens.COLOR_HANDLE}`,
            }}
            aria-label={`Drag to add a branch target (${side.replace('hub-', '')})`}
          />
        </React.Fragment>
      ))}

      <div
        onDoubleClick={startEdit}
        style={{
          background: tokens.COLOR_NODE_BG,
          borderRadius: 3,
          padding: '2px 6px',
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_EDGE_LABEL,
          fontWeight: FONT_WEIGHT_NODE_LABEL,
          color: selected ? tokens.COLOR_EDGE_SELECTED : tokens.COLOR_NODE_TEXT,
          cursor: 'grab',
          userSelect: 'none',
          transition: `color ${TRANSITION_FAST}`,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
        aria-label={editing ? 'Editing branch hub label' : `Branch hub: ${data.label}`}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e): void => setDraft(e.target.value)}
            onBlur={confirmEdit}
            onKeyDown={onKeyDown}
            autoFocus
            aria-label="Edit branch hub label"
            className="nodrag"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_EDGE_LABEL,
              fontWeight: FONT_WEIGHT_NODE_LABEL,
              color: tokens.COLOR_NODE_TEXT,
              width: Math.max(48, draft.length * 8),
              textAlign: 'center',
            }}
          />
        ) : (
          <span>{data.label}</span>
        )}
      </div>

      <style>{`
        /* Target handles: always hidden (stems connect programmatically) */
        .react-flow__node-branchHub .react-flow__handle-target { opacity: 0 !important; pointer-events: none !important; }
        /* Source handles: hidden by default, revealed when hub is hovered (C-12) */
        .react-flow__node-branchHub .hub-source-handle { opacity: 0; transition: opacity ${TRANSITION_FAST}, background-color ${TRANSITION_FAST}; }
        .react-flow__node-branchHub:hover .hub-source-handle { opacity: 1 !important; }
        .react-flow__node-branchHub .hub-source-handle:hover { background-color: ${tokens.COLOR_HANDLE_HOVER} !important; }
        .react-flow__node-branchHub input:focus-visible { outline: 1px solid ${tokens.COLOR_EDGE_SELECTED}; outline-offset: 2px; border-radius: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .react-flow__node-branchHub .hub-source-handle { transition: none !important; }
        }
      `}</style>
    </>
  )
}
