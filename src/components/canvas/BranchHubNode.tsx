import React, { useCallback, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import {
  COLOR_EDGE,
  COLOR_EDGE_SELECTED,
  COLOR_HANDLE,
  COLOR_HANDLE_HOVER,
  COLOR_NODE_BG,
  COLOR_NODE_TEXT,
  FONT_FAMILY,
  FONT_SIZE_NODE_LABEL,
  FONT_WEIGHT_NODE_LABEL,
  TRANSITION_FAST,
} from '@/lib/theme'

// BranchHubNode renders the shared relationship label hub for a branching edge (C-11).
// The hub is a draggable React Flow node — React Flow handles position/drag natively (C-17).
// Target handle (top) receives the stem edge; source handle (bottom) sends branch arrows (C-12).
export function BranchHubNode({ id, data: rawData, selected }: NodeProps): React.JSX.Element {
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

  const HANDLE_STYLE: React.CSSProperties = {
    background: COLOR_HANDLE,
    border: `1px solid ${COLOR_HANDLE}`,
    width: 10,
    height: 10,
    transition: `background ${TRANSITION_FAST}`,
  }

  return (
    <>
      {/* Stem connects here */}
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />

      <div
        onDoubleClick={startEdit}
        style={{
          background: COLOR_NODE_BG,
          border: `1px solid ${selected ? COLOR_EDGE_SELECTED : COLOR_EDGE}`,
          borderRadius: 4,
          padding: '4px 12px',
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_NODE_LABEL,
          fontWeight: FONT_WEIGHT_NODE_LABEL,
          color: selected ? COLOR_EDGE_SELECTED : COLOR_NODE_TEXT,
          cursor: 'grab',
          userSelect: 'none',
          transition: `border-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
          minWidth: 48,
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
              fontSize: FONT_SIZE_NODE_LABEL,
              fontWeight: FONT_WEIGHT_NODE_LABEL,
              color: COLOR_NODE_TEXT,
              width: Math.max(48, draft.length * 8),
              textAlign: 'center',
            }}
          />
        ) : (
          <span>{data.label}</span>
        )}
      </div>

      {/* Branch arrows connect from here */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          ...HANDLE_STYLE,
          background: COLOR_HANDLE_HOVER,
          border: `1px solid ${COLOR_HANDLE_HOVER}`,
        }}
        aria-label="Drag to add a branch target"
      />
      <style>{`
        .react-flow__node-branchHub .react-flow__handle:hover {
          background-color: ${COLOR_HANDLE_HOVER} !important;
        }
        .react-flow__node-branchHub input:focus-visible {
          outline: 1px solid ${COLOR_EDGE_SELECTED}; outline-offset: 2px; border-radius: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .react-flow__node-branchHub .react-flow__handle { transition: none !important; }
        }
      `}</style>
    </>
  )
}
