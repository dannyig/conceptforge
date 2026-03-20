import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, type CanvasHandle } from '@/components/canvas/Canvas'
import { HintTicker } from '@/components/canvas/HintTicker'
import { FocusQuestionBar } from '@/components/ai/FocusQuestionBar'
import { MissingKeyBanner } from '@/components/settings/MissingKeyBanner'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { SettingsTrigger } from '@/components/toolbar/SettingsTrigger'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { validateMapData } from '@/lib/export'
import { OPEN_SETTINGS_EVENT } from '@/lib/apiKey'

export function App(): React.JSX.Element {
  const canvasRef = useRef<CanvasHandle>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showMissingKeyBanner, setShowMissingKeyBanner] = useState(false)
  const [focusQuestion, setFocusQuestion] = useState('')
  const [nodeCount, setNodeCount] = useState(0)
  const [autoloadError, setAutoloadError] = useState<string | null>(null)

  // P-04, P-05, P-06 — URL autoload via ?autoload=<base64> query parameter
  // Supports both plain base64-JSON (legacy) and deflate-compressed base64 (P-08)
  useEffect((): void => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('autoload')
    // P-05 — strip param immediately, before any other side-effect
    window.history.replaceState({}, '', window.location.pathname)
    if (!encoded) return
    void (async (): Promise<void> => {
      try {
        const raw = atob(encoded)
        let json: string
        if (raw.startsWith('{') || raw.startsWith('[')) {
          // Legacy: plain JSON encoded as base64
          json = raw
        } else {
          // P-08: deflate-raw compressed then base64-encoded
          const bytes = Uint8Array.from(raw, c => c.charCodeAt(0))
          const ds = new DecompressionStream('deflate-raw')
          const writer = ds.writable.getWriter()
          void writer.write(bytes)
          void writer.close()
          const chunks: Uint8Array[] = []
          const reader = ds.readable.getReader()
          let chunk: ReadableStreamReadResult<Uint8Array>
          while (!(chunk = await reader.read()).done) chunks.push(chunk.value)
          const total = chunks.reduce((n, c) => n + c.length, 0)
          const merged = new Uint8Array(total)
          let offset = 0
          for (const c of chunks) {
            merged.set(c, offset)
            offset += c.length
          }
          json = new TextDecoder().decode(merged)
        }
        const mapData = validateMapData(JSON.parse(json))
        canvasRef.current?.setMapData(mapData)
        setFocusQuestion(mapData.focusQuestion ?? '')
      } catch {
        // P-06 — visible error; canvas remains empty
        setAutoloadError('Could not load map from URL — the link may be invalid or corrupted.')
      }
    })()
  }, [])

  // Listen for openSettings events dispatched by useApiKey hook
  useEffect((): (() => void) => {
    const handler = (): void => setIsSettingsOpen(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, handler)
    return (): void => window.removeEventListener(OPEN_SETTINGS_EVENT, handler)
  }, [])

  const openSettings = useCallback((): void => setIsSettingsOpen(true), [])
  const closeSettings = useCallback((): void => setIsSettingsOpen(false), [])
  const dismissBanner = useCallback((): void => setShowMissingKeyBanner(false), [])

  const handleOpenSettingsFromBanner = useCallback((): void => {
    setShowMissingKeyBanner(false)
    setIsSettingsOpen(true)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <FocusQuestionBar value={focusQuestion} onChange={setFocusQuestion} />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <Canvas ref={canvasRef} onNodeCountChange={setNodeCount} />
        <Toolbar
          canvasRef={canvasRef}
          hasNodes={nodeCount > 0}
          onFocusQuestionLoad={setFocusQuestion}
          autoloadError={autoloadError}
        />
        <SettingsTrigger onOpen={openSettings} />
        <SettingsPanel isOpen={isSettingsOpen} onClose={closeSettings} />
        <MissingKeyBanner
          isVisible={showMissingKeyBanner}
          onOpenSettings={handleOpenSettingsFromBanner}
          onDismiss={dismissBanner}
        />
        <HintTicker />
      </div>
    </div>
  )
}
