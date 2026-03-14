import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NodeResizer, useReactFlow, type Node, type NodeProps } from '@xyflow/react'
import {
  COLOR_NODE_SELECTED,
  FONT_FAMILY,
  NOTE_TEXT_SIZES,
  TRANSITION_FAST,
  TRANSITION_NORMAL,
} from '@/lib/theme'

export type NoteNodeData = {
  backgroundColor: string
  text?: string
  textSize?: 'small' | 'medium' | 'large'
}

export type NoteFlowNode = Node<NoteNodeData>

// G-08: derive contrasting text colour from background via perceived luminance
export function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance > 128 ? '#0d1117' : '#f0f6fc'
}

export function NoteNode({ id, data, selected }: NodeProps<NoteFlowNode>): React.JSX.Element {
  const { setNodes } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.text ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const textColor = getContrastText(data.backgroundColor)
  const fontSize = NOTE_TEXT_SIZES[data.textSize ?? 'medium']

  const startEdit = useCallback((): void => {
    setDraft(data.text ?? '')
    setEditing(true)
    setTimeout((): void => {
      textareaRef.current?.focus()
    }, 0)
  }, [data.text])

  const confirmEdit = useCallback((): void => {
    const trimmed = draft.trim()
    setNodes(nds =>
      nds.map(n => (n.id === id ? { ...n, data: { ...n.data, text: trimmed || undefined } } : n))
    )
    setEditing(false)
  }, [id, draft, setNodes])

  const cancelEdit = useCallback((): void => {
    setDraft(data.text ?? '')
    setEditing(false)
  }, [data.text])

  const onTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Escape') cancelEdit()
      // Allow Enter for newlines — do not confirm on Enter (unlike node/edge labels)
      e.stopPropagation()
    },
    [cancelEdit]
  )

  // Sync draft if external data.text changes (e.g. after undo-like operations)
  useEffect((): void => {
    if (!editing) setDraft(data.text ?? '')
  }, [data.text, editing])

  return (
    <>
      {/* G-03: resize handles — visible only when selected */}
      <NodeResizer
        minWidth={80}
        minHeight={60}
        isVisible={selected}
        lineStyle={{
          borderColor: COLOR_NODE_SELECTED,
          borderWidth: 1,
        }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: COLOR_NODE_SELECTED,
          border: 'none',
        }}
      />

      {/* G-02, G-04: note body — draggable, behind other nodes via zIndex on the RF node */}
      <div
        onDoubleClick={startEdit}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: data.backgroundColor,
          border: selected
            ? `1.5px solid ${COLOR_NODE_SELECTED}`
            : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6,
          padding: '8px 10px',
          boxSizing: 'border-box',
          transition: `border-color ${TRANSITION_NORMAL}`,
          overflow: 'hidden',
          cursor: editing ? 'default' : 'grab',
        }}
        aria-label={editing ? 'Editing note' : `Note: ${data.text ?? 'empty'}`}
      >
        {editing ? (
          // G-07: textarea for multi-line text, anchored top-left
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e): void => setDraft(e.target.value)}
            onBlur={confirmEdit}
            onKeyDown={onTextareaKeyDown}
            autoFocus
            aria-label="Edit note text"
            className="nodrag nopan"
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: textColor,
              fontFamily: FONT_FAMILY,
              fontSize,
              lineHeight: 1.5,
              padding: 0,
              cursor: 'text',
            }}
          />
        ) : data.text ? (
          <span
            style={{
              color: textColor,
              fontFamily: FONT_FAMILY,
              fontSize,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              userSelect: 'none',
              display: 'block',
              transition: `color ${TRANSITION_FAST}, font-size ${TRANSITION_FAST}`,
            }}
          >
            {data.text}
          </span>
        ) : (
          // G-07: placeholder when no text
          <span
            aria-hidden="true"
            style={{
              color: textColor,
              fontFamily: FONT_FAMILY,
              fontSize,
              opacity: 0.35,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            Double-click to add text…
          </span>
        )}
      </div>
    </>
  )
}
