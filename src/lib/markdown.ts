import React from 'react'
import type { ThemeTokens } from '@/lib/theme'
import { FONT_FAMILY, FONT_SIZE_BASE, FONT_SIZE_SMALL } from '@/lib/theme'

// Renders inline spans: **bold**, *italic*, `code`
export function renderInline(
  text: string,
  baseKey: string,
  tokens: ThemeTokens
): React.ReactNode[] {
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
        React.createElement(
          'code',
          {
            key: `${baseKey}-ic-${idx}`,
            style: {
              fontFamily: FONT_FAMILY,
              background: tokens.COLOR_CODE_BG,
              padding: '1px 4px',
              borderRadius: 3,
              fontSize: '0.9em',
            },
          },
          token.slice(1, -1)
        )
      )
    } else if (token.startsWith('**')) {
      result.push(React.createElement('strong', { key: `${baseKey}-b-${idx}` }, token.slice(2, -2)))
    } else {
      result.push(React.createElement('em', { key: `${baseKey}-i-${idx}` }, token.slice(1, -1)))
    }
    last = match.index + token.length
    idx++
  }
  if (last < text.length) result.push(text.slice(last))
  return result
}

// Renders block-level markdown using a line-by-line state machine.
// Handles mixed content on consecutive lines including tables.
export function renderMarkdown(text: string, tokens: ThemeTokens): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let key = 0

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
    background: tokens.COLOR_CODE_BG,
    border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
    borderRadius: 6,
    padding: '12px 14px',
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_SMALL,
    color: tokens.COLOR_NODE_TEXT,
    overflowX: 'auto',
    whiteSpace: 'pre',
    margin: 0,
  }

  const liStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_BASE,
    color: tokens.COLOR_NODE_TEXT,
    lineHeight: '1.75',
    marginBottom: 3,
  }

  const pStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_BASE,
    color: tokens.COLOR_NODE_TEXT,
    lineHeight: '1.8',
    margin: '6px 0',
  }

  for (const seg of segments) {
    if (seg.type === 'code') {
      result.push(
        React.createElement(
          'pre',
          { key: key++, style: { margin: '10px 0' } },
          React.createElement('code', { style: codeBlockStyle }, seg.content.trimEnd())
        )
      )
      continue
    }

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
            React.createElement(
              'p',
              { key: key++, style: pStyle },
              renderInline(combined, `p-${key}`, tokens)
            )
          )
        }
        paraLines = []
      } else if (state === 'ul' && listItems.length > 0) {
        const items = listItems.slice()
        result.push(
          React.createElement(
            'ul',
            { key: key++, style: { margin: '6px 0', paddingLeft: 22 } },
            items.map((item, j) =>
              React.createElement(
                'li',
                { key: j, style: liStyle },
                renderInline(item, `ul-${key}-${j}`, tokens)
              )
            )
          )
        )
        listItems = []
      } else if (state === 'ol' && listItems.length > 0) {
        const items = listItems.slice()
        result.push(
          React.createElement(
            'ol',
            { key: key++, style: { margin: '6px 0', paddingLeft: 22 } },
            items.map((item, j) =>
              React.createElement(
                'li',
                { key: j, style: liStyle },
                renderInline(item, `ol-${key}-${j}`, tokens)
              )
            )
          )
        )
        listItems = []
      } else if (state === 'table' && tableRows.length > 0) {
        const rows = tableRows.slice()
        const sepIdx = rows.findIndex(isSeparatorRow)
        const headerRows = sepIdx > 0 ? rows.slice(0, sepIdx) : []
        const bodyRows = sepIdx >= 0 ? rows.slice(sepIdx + 1) : rows

        const thStyle: React.CSSProperties = {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BASE,
          color: tokens.COLOR_NODE_TEXT,
          fontWeight: 600,
          padding: '6px 12px',
          borderBottom: `2px solid ${tokens.COLOR_NODE_BORDER}`,
          textAlign: 'left',
          whiteSpace: 'nowrap',
        }
        const tdStyle: React.CSSProperties = {
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BASE,
          color: tokens.COLOR_NODE_TEXT,
          padding: '5px 12px',
          borderBottom: `1px solid ${tokens.COLOR_NODE_BORDER}`,
          verticalAlign: 'top',
        }

        result.push(
          React.createElement(
            'div',
            { key: key++, style: { overflowX: 'auto', margin: '10px 0' } },
            React.createElement(
              'table',
              { style: { borderCollapse: 'collapse', width: '100%', minWidth: 300 } },
              headerRows.length > 0
                ? React.createElement(
                    'thead',
                    null,
                    headerRows.map((row, i) =>
                      React.createElement(
                        'tr',
                        { key: i },
                        row.map((cell, j) =>
                          React.createElement(
                            'th',
                            { key: j, style: thStyle },
                            renderInline(cell, `th-${key}-${i}-${j}`, tokens)
                          )
                        )
                      )
                    )
                  )
                : null,
              React.createElement(
                'tbody',
                null,
                bodyRows.map((row, i) =>
                  React.createElement(
                    'tr',
                    { key: i },
                    row.map((cell, j) =>
                      React.createElement(
                        'td',
                        { key: j, style: tdStyle },
                        renderInline(cell, `td-${key}-${i}-${j}`, tokens)
                      )
                    )
                  )
                )
              )
            )
          )
        )
        tableRows = []
      }
      state = 'idle'
    }

    for (const line of seg.content.split('\n')) {
      if (!line.trim()) {
        flush()
        continue
      }

      const h3 = line.match(/^### (.+)/)
      if (h3) {
        flush()
        result.push(
          React.createElement(
            'h3',
            {
              key: key++,
              style: {
                fontFamily: FONT_FAMILY,
                fontSize: '15px',
                color: tokens.COLOR_NODE_TEXT,
                margin: '14px 0 6px',
                fontWeight: 600,
              },
            },
            renderInline(h3[1], `h3-${key}`, tokens)
          )
        )
        continue
      }
      const h2 = line.match(/^## (.+)/)
      if (h2) {
        flush()
        result.push(
          React.createElement(
            'h2',
            {
              key: key++,
              style: {
                fontFamily: FONT_FAMILY,
                fontSize: '17px',
                color: tokens.COLOR_NODE_TEXT,
                margin: '16px 0 6px',
                fontWeight: 600,
              },
            },
            renderInline(h2[1], `h2-${key}`, tokens)
          )
        )
        continue
      }
      const h1 = line.match(/^# (.+)/)
      if (h1) {
        flush()
        result.push(
          React.createElement(
            'h1',
            {
              key: key++,
              style: {
                fontFamily: FONT_FAMILY,
                fontSize: '20px',
                color: tokens.COLOR_NODE_TEXT,
                margin: '18px 0 8px',
                fontWeight: 700,
              },
            },
            renderInline(h1[1], `h1-${key}`, tokens)
          )
        )
        continue
      }

      if (/^\s*\|/.test(line)) {
        if (state !== 'table') {
          flush()
          state = 'table'
        }
        tableRows.push(parseTableRow(line))
        continue
      }

      const ulMatch = line.match(/^[ \t]*[-*]\s+(.+)/)
      if (ulMatch) {
        if (state !== 'ul') {
          flush()
          state = 'ul'
        }
        listItems.push(ulMatch[1])
        continue
      }

      const olMatch = line.match(/^[ \t]*\d+\.\s+(.+)/)
      if (olMatch) {
        if (state !== 'ol') {
          flush()
          state = 'ol'
        }
        listItems.push(olMatch[1])
        continue
      }

      if (state !== 'paragraph') {
        flush()
        state = 'paragraph'
      }
      paraLines.push(line)
    }

    flush()
  }

  return result
}
