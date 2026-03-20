import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { CanvasHandle } from '@/components/canvas/Canvas'
import { loadMapFromJson, saveMapToJson } from '@/lib/export'
import {
  COLOR_BUTTON_GHOST_HOVER_BG,
  COLOR_BUTTON_PRIMARY_BG,
  COLOR_BUTTON_PRIMARY_HOVER_BG,
  COLOR_BUTTON_PRIMARY_TEXT,
  COLOR_NODE_BG,
  COLOR_NODE_BORDER,
  COLOR_NODE_TEXT,
  COLOR_PANEL_BG,
  COLOR_STATUS_ERROR,
  COLOR_STATUS_SUCCESS,
  COLOR_TEXT_MUTED,
  FONT_FAMILY,
  FONT_SIZE_SMALL,
  FONT_SIZE_BASE,
  TRANSITION_FAST,
  TRANSITION_NORMAL,
} from '@/lib/theme'

const SKILL_MANIFEST_URL = 'https://dannyig.github.io/conceptforge/manifest.json'
const SKILL_DOWNLOAD_URL = 'https://dannyig.github.io/conceptforge/cmap.md'

interface AppMenuProps {
  canvasRef: React.RefObject<CanvasHandle | null>
  hasNodes: boolean
  onFocusQuestionLoad: (q: string) => void
  onOpenSettings: () => void
  autoloadError?: string | null
}

function MenuIcon(): React.JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
    </svg>
  )
}

function SaveIcon(): React.JSX.Element {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4.5a1 1 0 0 0-.293-.707l-2.5-2.5A1 1 0 0 0 11.5 1H2zm9.5 1.5 2 2H11a.5.5 0 0 1-.5-.5V2.5h1zm-8 0h6V4a1.5 1.5 0 0 0 1.5 1.5h2V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5h.5z" />
    </svg>
  )
}

function LoadIcon(): React.JSX.Element {
  return (
    <svg
      width="13"
      height="13"
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

function GearIcon(): React.JSX.Element {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.892 3.433-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.892-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
    </svg>
  )
}

function DownloadIcon(): React.JSX.Element {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
    </svg>
  )
}

const MENU_ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 14px',
  background: 'none',
  border: 'none',
  borderRadius: 4,
  color: COLOR_TEXT_MUTED,
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE_SMALL,
  cursor: 'pointer',
  textAlign: 'left',
  transition: `background-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
  whiteSpace: 'nowrap',
}

export function AppMenu({
  canvasRef,
  hasNodes,
  onFocusQuestionLoad,
  onOpenSettings,
  autoloadError = null,
}: AppMenuProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const [skillVersion, setSkillVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayedError = error ?? autoloadError

  // SK-04 — fetch skill manifest on mount
  useEffect((): void => {
    fetch(SKILL_MANIFEST_URL)
      .then(r => r.json())
      .then((data: unknown) => {
        if (
          typeof data === 'object' &&
          data !== null &&
          'version' in data &&
          typeof (data as Record<string, unknown>).version === 'string'
        ) {
          setSkillVersion((data as Record<string, string>).version)
        }
      })
      .catch(() => {
        // SK-04: fail silently — version stays null → shows "unavailable"
      })
  }, [])

  // Close menu on outside click or Escape
  useEffect((): (() => void) => {
    if (!menuOpen) return (): void => {}
    const handleClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick, true)
    document.addEventListener('keydown', handleKey)
    return (): void => {
      document.removeEventListener('mousedown', handleClick, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const handleSave = useCallback((): void => {
    const data = canvasRef.current?.getMapData()
    if (!data) return
    setError(null)
    setMenuOpen(false)
    saveMapToJson(data)
  }, [canvasRef])

  const handleLoad = useCallback(async (): Promise<void> => {
    setError(null)
    setMenuOpen(false)
    try {
      const data = await loadMapFromJson()
      canvasRef.current?.setMapData(data)
      onFocusQuestionLoad(data.focusQuestion ?? '')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load file'
      if (msg !== 'No file selected') setError(msg)
    }
  }, [canvasRef, onFocusQuestionLoad])

  const handleSettings = useCallback((): void => {
    setMenuOpen(false)
    onOpenSettings()
  }, [onOpenSettings])

  // SK-06 — download skill file and show placement instructions
  const handleSkillDownload = useCallback(async (): Promise<void> => {
    setMenuOpen(false)
    setError(null)
    try {
      const res = await fetch(SKILL_DOWNLOAD_URL)
      if (!res.ok) throw new Error('Download failed')
      const text = await res.text()
      const blob = new Blob([text], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cmap.md'
      a.click()
      URL.revokeObjectURL(url)
      setShowInstructions(true)
    } catch {
      setError('Could not download skill — check your connection and try again')
    }
  }, [])

  const skillLabel =
    skillVersion !== null ? `Download cmap skill v${skillVersion}` : 'Download cmap skill'
  const skillSubLabel = skillVersion === null ? '(unavailable)' : null

  return (
    <>
      <style>{`
        .cf-menu-trigger:hover { background-color: ${COLOR_BUTTON_GHOST_HOVER_BG} !important; color: ${COLOR_NODE_TEXT} !important; }
        .cf-menu-trigger:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }
        .cf-menu-item:hover:not(:disabled) { background-color: ${COLOR_BUTTON_GHOST_HOVER_BG} !important; color: ${COLOR_NODE_TEXT} !important; }
        .cf-menu-item:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }
        .cf-menu-item:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div ref={menuRef} style={{ position: 'absolute', top: 16, right: 16, zIndex: 30 }}>
        {/* Menu trigger button */}
        <button
          className="cf-menu-trigger"
          onClick={(): void => setMenuOpen(o => !o)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          style={{
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
            transition: `background-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
          }}
        >
          <MenuIcon />
          <span>Menu</span>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              backgroundColor: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 6,
              padding: '4px',
              minWidth: 220,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <button
              className="cf-menu-item"
              role="menuitem"
              style={MENU_ITEM_STYLE}
              onClick={handleSave}
              disabled={!hasNodes}
              aria-label="Save map as JSON"
            >
              <SaveIcon />
              <span>Save</span>
            </button>

            <button
              className="cf-menu-item"
              role="menuitem"
              style={MENU_ITEM_STYLE}
              onClick={(): void => {
                void handleLoad()
              }}
              aria-label="Load map from JSON"
            >
              <LoadIcon />
              <span>Load</span>
            </button>

            <div
              style={{
                height: 1,
                backgroundColor: COLOR_NODE_BORDER,
                margin: '3px 10px',
              }}
            />

            <button
              className="cf-menu-item"
              role="menuitem"
              style={MENU_ITEM_STYLE}
              onClick={handleSettings}
              aria-label="Open settings"
            >
              <GearIcon />
              <span>Settings</span>
            </button>

            <div
              style={{
                height: 1,
                backgroundColor: COLOR_NODE_BORDER,
                margin: '3px 10px',
              }}
            />

            <button
              className="cf-menu-item"
              role="menuitem"
              style={MENU_ITEM_STYLE}
              onClick={(): void => {
                void handleSkillDownload()
              }}
              disabled={skillVersion === null}
              aria-label={skillLabel}
            >
              <DownloadIcon />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span>{skillLabel}</span>
                {skillSubLabel && (
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>{skillSubLabel}</span>
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Error display */}
      {displayedError !== null && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 56,
            right: 16,
            zIndex: 30,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            color: COLOR_STATUS_ERROR,
          }}
        >
          {displayedError}
        </div>
      )}

      {/* SK-06 — placement instruction panel */}
      {showInstructions && (
        <div
          role="dialog"
          aria-label="Skill installation instructions"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(13,17,23,0.7)',
          }}
          onClick={(e): void => {
            if (e.target === e.currentTarget) setShowInstructions(false)
          }}
        >
          <div
            style={{
              backgroundColor: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 8,
              padding: '28px 32px',
              maxWidth: 480,
              width: '90vw',
              fontFamily: FONT_FAMILY,
              color: COLOR_NODE_TEXT,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <span style={{ color: COLOR_STATUS_SUCCESS, fontSize: 18 }}>✓</span>
              <span style={{ fontSize: FONT_SIZE_BASE, fontWeight: 500 }}>cmap.md downloaded</span>
            </div>
            <p
              style={{
                margin: '0 0 16px',
                fontSize: FONT_SIZE_SMALL,
                lineHeight: 1.6,
                color: COLOR_TEXT_MUTED,
              }}
            >
              Place the file in your Claude Code commands directory so Claude Code can find it:
            </p>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '10px', color: COLOR_TEXT_MUTED, marginBottom: 4 }}>
                macOS / Linux
              </div>
              <code
                style={{
                  display: 'block',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${COLOR_NODE_BORDER}`,
                  borderRadius: 4,
                  padding: '7px 10px',
                  fontSize: FONT_SIZE_SMALL,
                  color: COLOR_NODE_TEXT,
                }}
              >
                ~/.claude/commands/cmap.md
              </code>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '10px', color: COLOR_TEXT_MUTED, marginBottom: 4 }}>
                Windows
              </div>
              <code
                style={{
                  display: 'block',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${COLOR_NODE_BORDER}`,
                  borderRadius: 4,
                  padding: '7px 10px',
                  fontSize: FONT_SIZE_SMALL,
                  color: COLOR_NODE_TEXT,
                }}
              >
                %USERPROFILE%\.claude\commands\cmap.md
              </code>
            </div>
            <p
              style={{
                margin: '0 0 24px',
                fontSize: FONT_SIZE_SMALL,
                lineHeight: 1.6,
                color: COLOR_TEXT_MUTED,
              }}
            >
              Then use <strong style={{ color: COLOR_NODE_TEXT }}>/cmap your topic</strong> in any
              Claude Code project to generate a concept map.
            </p>
            <button
              onClick={(): void => setShowInstructions(false)}
              style={{
                padding: '8px 20px',
                backgroundColor: COLOR_BUTTON_PRIMARY_BG,
                border: 'none',
                borderRadius: 6,
                color: COLOR_BUTTON_PRIMARY_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                fontWeight: 500,
                cursor: 'pointer',
                transition: `background-color ${TRANSITION_NORMAL}`,
              }}
              onMouseEnter={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  COLOR_BUTTON_PRIMARY_HOVER_BG
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  COLOR_BUTTON_PRIMARY_BG
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
