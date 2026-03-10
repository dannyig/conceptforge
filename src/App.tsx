import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, type CanvasHandle } from '@/components/canvas/Canvas'
import { MissingKeyBanner } from '@/components/settings/MissingKeyBanner'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { SettingsTrigger } from '@/components/toolbar/SettingsTrigger'
import { OPEN_SETTINGS_EVENT } from '@/lib/apiKey'

export function App(): React.JSX.Element {
  const canvasRef = useRef<CanvasHandle>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showMissingKeyBanner, setShowMissingKeyBanner] = useState(false)

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
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Canvas ref={canvasRef} />
      <SettingsTrigger onOpen={openSettings} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={closeSettings} />
      <MissingKeyBanner
        isVisible={showMissingKeyBanner}
        onOpenSettings={handleOpenSettingsFromBanner}
        onDismiss={dismissBanner}
      />
    </div>
  )
}
