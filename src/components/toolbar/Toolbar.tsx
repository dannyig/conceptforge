import React, { useCallback, useRef, useState } from 'react'
import type { CanvasHandle } from '@/components/canvas/Canvas'
import { loadMapFromJson, saveMapToJson } from '@/lib/export'
import {
  COLOR_BUTTON_GHOST_HOVER_BG,
  COLOR_NODE_BORDER,
  COLOR_NODE_TEXT,
  COLOR_PANEL_BG,
  COLOR_STATUS_ERROR,
  COLOR_TEXT_MUTED,
  FONT_FAMILY,
  FONT_SIZE_SMALL,
  TRANSITION_FAST,
} from '@/lib/theme'
import { FilenamePrompt } from './FilenamePrompt'

interface ToolbarProps {
  canvasRef: React.RefObject<CanvasHandle | null>
  hasNodes: boolean
  onFocusQuestionLoad: (q: string) => void
  autoloadError?: string | null
}

function SaveIcon(): React.JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4.5a1 1 0 0 0-.293-.707l-2.5-2.5A1 1 0 0 0 11.5 1H2zm9.5 1.5 2 2H11a.5.5 0 0 1-.5-.5V2.5h1zm-8 0h6V4a1.5 1.5 0 0 0 1.5 1.5h2V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5h.5z" />
      <path d="M9.5 8.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1h3zm-3-2h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1zm0 4h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1z" />
    </svg>
  )
}

function LoadIcon(): React.JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
    </svg>
  )
}

const BUTTON_BASE_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  backgroundColor: COLOR_PANEL_BG,
  border: `1px solid ${COLOR_NODE_BORDER}`,
  borderRadius: 6,
  color: COLOR_TEXT_MUTED,
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE_SMALL,
  cursor: 'pointer',
  transition: `background-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
}

export function Toolbar({
  canvasRef,
  hasNodes,
  onFocusQuestionLoad,
  autoloadError = null,
}: ToolbarProps): React.JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const displayedError = error ?? autoloadError
  const [promptOpen, setPromptOpen] = useState(false)
  const [lastFilename, setLastFilename] = useState('')
  // Snapshot map data at the moment Save is clicked; passed to saveMapToJson on confirm
  const pendingDataRef = useRef<ReturnType<NonNullable<CanvasHandle>['getMapData']> | null>(null)

  const handleSave = useCallback((): void => {
    const data = canvasRef.current?.getMapData()
    if (!data) return
    setError(null)
    pendingDataRef.current = data
    setPromptOpen(true)
  }, [canvasRef])

  const handlePromptConfirm = useCallback((filename: string): void => {
    if (!pendingDataRef.current) return
    saveMapToJson(pendingDataRef.current, filename)
    setLastFilename(filename)
    setPromptOpen(false)
    pendingDataRef.current = null
  }, [])

  const handlePromptCancel = useCallback((): void => {
    setPromptOpen(false)
    pendingDataRef.current = null
  }, [])

  const handleLoad = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      const data = await loadMapFromJson()
      canvasRef.current?.setMapData(data)
      onFocusQuestionLoad(data.focusQuestion ?? '')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load file'
      if (msg !== 'No file selected') setError(msg)
    }
  }, [canvasRef, onFocusQuestionLoad])

  return (
    <>
      <style>{`
        .cf-toolbar-btn:hover:not(:disabled) { background-color: ${COLOR_BUTTON_GHOST_HOVER_BG} !important; color: ${COLOR_NODE_TEXT} !important; }
        .cf-toolbar-btn:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }
        .cf-toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="cf-toolbar-btn"
            style={BUTTON_BASE_STYLE}
            onClick={handleSave}
            disabled={!hasNodes}
            aria-label="Save map as JSON"
          >
            <SaveIcon />
            <span>Save</span>
          </button>
          <button
            className="cf-toolbar-btn"
            style={BUTTON_BASE_STYLE}
            onClick={(): void => {
              void handleLoad()
            }}
            aria-label="Load map from JSON"
          >
            <LoadIcon />
            <span>Load</span>
          </button>
        </div>
        {displayedError !== null && (
          <span
            role="alert"
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: COLOR_STATUS_ERROR,
            }}
          >
            {displayedError}
          </span>
        )}
      </div>

      {promptOpen && (
        <FilenamePrompt
          defaultValue={lastFilename}
          onConfirm={handlePromptConfirm}
          onCancel={handlePromptCancel}
        />
      )}
    </>
  )
}
