import React, { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  COLOR_NODE_BORDER,
  COLOR_NODE_SELECTED,
  COLOR_NODE_TEXT,
  COLOR_SUMMARY_BORDER,
  COLOR_TEXT_MUTED,
  FONT_FAMILY,
  FONT_SIZE_BASE,
  FONT_SIZE_SMALL,
  TRANSITION_FAST,
} from '@/lib/theme'

// Renders inline spans: **bold**, *italic*, `code`
function renderInline(text: string, baseKey: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match: RegExpExecArray | null
  let idx = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) result.push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('`')) {
      result.push(
        <code
          key={`${baseKey}-ic-${idx}`}
          style={{
            fontFamily: FONT_FAMILY,
            background: '#1c2128',
            padding: '1px 4px',
            borderRadius: 3,
            fontSize: '0.9em',
          }}
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('**')) {
      result.push(<strong key={`${baseKey}-b-${idx}`}>{token.slice(2, -2)}</strong>)
    } else {
      result.push(<em key={`${baseKey}-i-${idx}`}>{token.slice(1, -1)}</em>)
    }
    last = match.index + token.length
    idx++
  }
  if (last < text.length) result.push(text.slice(last))
  return result
}

// Renders block-level markdown using a line-by-line state machine.
// This correctly handles Claude responses that mix intro text with lists on
// consecutive lines (no double-newline separator between them).
function renderMarkdown(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let key = 0

  // Extract fenced code blocks first so their content is never processed as markdown
  const codeBlockRe = /```(?:[^\n]*)?\n?([\s\S]*?)```/g
  const segments: Array<{ type: 'text' | 'code'; content: string }> = []
  let last = 0
  let m: RegExpExecArray | null

  while ((m = codeBlockRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', content: text.slice(last, m.index) })
    segments.push({ type: 'code', content: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) })

  const codeBlockStyle: React.CSSProperties = {
    display: 'block',
    background: '#1c2128',
    border: `1px solid ${COLOR_NODE_BORDER}`,
    borderRadius: 6,
    padding: '12px 14px',
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_SMALL,
    color: COLOR_NODE_TEXT,
    overflowX: 'auto',
    whiteSpace: 'pre',
    margin: 0,
  }

  const liStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_BASE,
    color: COLOR_NODE_TEXT,
    lineHeight: '1.75',
    marginBottom: 3,
  }

  const pStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_BASE,
    color: COLOR_NODE_TEXT,
    lineHeight: '1.8',
    margin: '6px 0',
  }

  for (const seg of segments) {
    if (seg.type === 'code') {
      result.push(
        <pre key={key++} style={{ margin: '10px 0' }}>
          <code style={codeBlockStyle}>{seg.content.trimEnd()}</code>
        </pre>
      )
      continue
    }

    // Line-by-line state machine — handles mixed content on consecutive lines,
    // including tables (| col | col |) with optional separator rows (|---|).
    type State = 'idle' | 'paragraph' | 'ul' | 'ol' | 'table'
    let state: State = 'idle'
    let paraLines: string[] = []
    let listItems: string[] = []
    let tableRows: string[][] = []

    const isSeparatorRow = (cells: string[]): boolean => cells.every(c => /^:?-+:?$/.test(c.trim()))

    const parseTableRow = (line: string): string[] =>
      line
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split('|')
        .map(c => c.trim())

    const flush = (): void => {
      if (state === 'paragraph' && paraLines.length > 0) {
        const combined = paraLines.join(' ').trim()
        if (combined) {
          result.push(
            <p key={key++} style={pStyle}>
              {renderInline(combined, `p-${key}`)}
            </p>
          )
        }
        paraLines = []
      } else if (state === 'ul' && listItems.length > 0) {
        const items = listItems.slice()
        result.push(
          <ul key={key++} style={{ margin: '6px 0', paddingLeft: 22 }}>
            {items.map((item, j) => (
              <li key={j} style={liStyle}>
                {renderInline(item, `ul-${key}-${j}`)}
              </li>
            ))}
          </ul>
        )
        listItems = []
      } else if (state === 'ol' && listItems.length > 0) {
        const items = listItems.slice()
        result.push(
          <ol key={key++} style={{ margin: '6px 0', paddingLeft: 22 }}>
            {items.map((item, j) => (
              <li key={j} style={liStyle}>
                {renderInline(item, `ol-${key}-${j}`)}
              </li>
            ))}
          </ol>
        )
        listItems = []
      } else if (state === 'table' && tableRows.length > 0) {
        const rows = tableRows.slice()
        // Separator row separates header from body; discard it
        const sepIdx = rows.findIndex(isSeparatorRow)
        const headerRows = sepIdx > 0 ? rows.slice(0, sepIdx) : []
        const bodyRows = sepIdx >= 0 ? rows.slice(sepIdx + 1) : rows

        const thStyle: React.CSSProperties = {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BASE,
          color: COLOR_NODE_TEXT,
          fontWeight: 600,
          padding: '6px 12px',
          borderBottom: `2px solid ${COLOR_NODE_BORDER}`,
          textAlign: 'left',
          whiteSpace: 'nowrap',
        }
        const tdStyle: React.CSSProperties = {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BASE,
          color: COLOR_NODE_TEXT,
          padding: '5px 12px',
          borderBottom: `1px solid ${COLOR_NODE_BORDER}`,
          verticalAlign: 'top',
        }

        result.push(
          <div key={key++} style={{ overflowX: 'auto', margin: '10px 0' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 300 }}>
              {headerRows.length > 0 && (
                <thead>
                  {headerRows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <th key={j} style={thStyle}>
                          {renderInline(cell, `th-${key}-${i}-${j}`)}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} style={tdStyle}>
                        {renderInline(cell, `td-${key}-${i}-${j}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
      }
      state = 'idle'
    }

    for (const line of seg.content.split('\n')) {
      // Blank line always flushes the current block
      if (!line.trim()) {
        flush()
        continue
      }

      // Headings — always flush first
      const h3 = line.match(/^### (.+)/)
      if (h3) {
        flush()
        result.push(
          <h3
            key={key++}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '15px',
              color: COLOR_NODE_TEXT,
              margin: '14px 0 6px',
              fontWeight: 600,
            }}
          >
            {renderInline(h3[1], `h3-${key}`)}
          </h3>
        )
        continue
      }
      const h2 = line.match(/^## (.+)/)
      if (h2) {
        flush()
        result.push(
          <h2
            key={key++}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '17px',
              color: COLOR_NODE_TEXT,
              margin: '16px 0 6px',
              fontWeight: 600,
            }}
          >
            {renderInline(h2[1], `h2-${key}`)}
          </h2>
        )
        continue
      }
      const h1 = line.match(/^# (.+)/)
      if (h1) {
        flush()
        result.push(
          <h1
            key={key++}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '20px',
              color: COLOR_NODE_TEXT,
              margin: '18px 0 8px',
              fontWeight: 700,
            }}
          >
            {renderInline(h1[1], `h1-${key}`)}
          </h1>
        )
        continue
      }

      // Table row — line starts (and ends) with |
      if (/^\s*\|/.test(line)) {
        if (state !== 'table') {
          flush()
          state = 'table'
        }
        tableRows.push(parseTableRow(line))
        continue
      }

      // Unordered list item
      const ulMatch = line.match(/^[ \t]*[-*]\s+(.+)/)
      if (ulMatch) {
        if (state !== 'ul') {
          flush()
          state = 'ul'
        }
        listItems.push(ulMatch[1])
        continue
      }

      // Ordered list item
      const olMatch = line.match(/^[ \t]*\d+\.\s+(.+)/)
      if (olMatch) {
        if (state !== 'ol') {
          flush()
          state = 'ol'
        }
        listItems.push(olMatch[1])
        continue
      }

      // Plain text — accumulate as paragraph
      if (state !== 'paragraph') {
        flush()
        state = 'paragraph'
      }
      paraLines.push(line)
    }

    flush() // emit any remaining buffered content
  }

  return result
}

interface ChatReadingPanelProps {
  content: string
  onDismiss: () => void
}

// A-32: centred reading panel, 70% viewport, markdown rendering, dismiss button + outside-click
export function ChatReadingPanel({ content, onDismiss }: ChatReadingPanelProps): React.JSX.Element {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent): void => {
      if (e.target === e.currentTarget) onDismiss()
    },
    [onDismiss]
  )

  // Dismiss on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    return (): void => document.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return createPortal(
    <div
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Reading view"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        .cf-reading-dismiss:hover { background-color: #21262d !important; }
        .cf-reading-dismiss:focus-visible { outline: 2px solid ${COLOR_NODE_SELECTED}; outline-offset: 2px; }
      `}</style>

      <div
        style={{
          width: '70vw',
          height: '70vh',
          backgroundColor: '#161b22',
          border: `1px solid ${COLOR_SUMMARY_BORDER}`,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 18px',
            borderBottom: `1px solid ${COLOR_SUMMARY_BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '10px',
              fontWeight: '600',
              color: COLOR_TEXT_MUTED,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Reading View
          </span>
          <button
            className="cf-reading-dismiss"
            onClick={onDismiss}
            aria-label="Close reading view"
            style={{
              width: 24,
              height: 24,
              background: 'transparent',
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 4,
              fontFamily: FONT_FAMILY,
              fontSize: '16px',
              color: COLOR_TEXT_MUTED,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background-color ${TRANSITION_FAST}`,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable markdown content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '22px 28px',
          }}
        >
          {renderMarkdown(content)}
        </div>
      </div>
    </div>,
    document.body
  )
}
