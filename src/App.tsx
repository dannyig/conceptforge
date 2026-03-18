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
  useEffect((): void => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('autoload')
    // P-05 — strip param immediately, before any other side-effect
    window.history.replaceState({}, '', window.location.pathname)
    if (!encoded) return
    try {
      const mapData = validateMapData(JSON.parse(atob(encoded)))
      canvasRef.current?.setMapData(mapData)
      setFocusQuestion(mapData.focusQuestion ?? '')
    } catch {
      // P-06 — visible error; canvas remains empty
      setAutoloadError('Could not load map from URL — the link may be invalid or corrupted.')
    }
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
