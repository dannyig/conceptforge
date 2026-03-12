import React, { useCallback, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, type Node, type NodeProps } from '@xyflow/react'
import {
  COLOR_HANDLE,
  COLOR_HANDLE_HOVER,
  COLOR_NODE_BG,
  COLOR_NODE_BORDER,
  COLOR_NODE_GLOW,
  COLOR_NODE_SELECTED,
  COLOR_NODE_TEXT,
  FONT_FAMILY,
  FONT_SIZE_NODE_LABEL,
  FONT_WEIGHT_NODE_LABEL,
  TRANSITION_FAST,
  TRANSITION_NORMAL,
} from '@/lib/theme'

export type NodeData = {
  label: string
  conceptType?: 'concept' | 'question' | 'source' | 'insight'
}

export type ConceptFlowNode = Node<NodeData>

const HANDLE_BASE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  backgroundColor: COLOR_HANDLE,
  border: `1px solid ${COLOR_HANDLE}`,
  transition: `background-color ${TRANSITION_FAST}`,
}

export function ConceptNode({ id, data, selected }: NodeProps<ConceptFlowNode>): React.JSX.Element {
  const { setNodes } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)
  const [hovered, setHovered] = useState(false)
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
      onDoubleClick={startEdit}
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
      <Handle
        type="target"
        position={Position.Top}
        style={HANDLE_BASE_STYLE}
        aria-label="Connect from above"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={HANDLE_BASE_STYLE}
        aria-label="Connect below"
      />
      <Handle
        type="target"
        position={Position.Left}
        style={HANDLE_BASE_STYLE}
        aria-label="Connect from left"
      />
      <Handle
        type="source"
        position={Position.Right}
        style={HANDLE_BASE_STYLE}
        aria-label="Connect right"
      />

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

      {/* Handle hover + input focus-visible styles — pseudo-class styles not possible with inline styles */}
      <style>{`
        .react-flow__handle:hover { background-color: ${COLOR_HANDLE_HOVER} !important; }
        .react-flow__node input:focus-visible { outline: 1px solid ${COLOR_NODE_SELECTED}; outline-offset: 2px; border-radius: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .react-flow__handle { transition: none !important; }
        }
      `}</style>
    </div>
  )
}
