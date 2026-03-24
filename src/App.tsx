import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, type CanvasHandle } from '@/components/canvas/Canvas'
import { HintTicker } from '@/components/canvas/HintTicker'
import { FocusQuestionBar } from '@/components/ai/FocusQuestionBar'
import { SummaryPanel } from '@/components/ai/SummaryPanel'
import { MissingKeyBanner } from '@/components/settings/MissingKeyBanner'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { AppMenu } from '@/components/toolbar/AppMenu'
import { validateMapData } from '@/lib/export'
import { getApiKey, OPEN_SETTINGS_EVENT } from '@/lib/apiKey'
import { useApiKey } from '@/hooks/useApiKey'
import { generateMap, suggestConcepts } from '@/lib/claude'
import { autoLayout, ringPositions } from '@/lib/graph'
import type { SummaryResource } from '@/types'

export function App(): React.JSX.Element {
  const canvasRef = useRef<CanvasHandle>(null)
  const { aiAssistEnabled } = useApiKey()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showMissingKeyBanner, setShowMissingKeyBanner] = useState(false)
  const [focusQuestion, setFocusQuestion] = useState('')
  const [nodeCount, setNodeCount] = useState(0)
  const [autoloadError, setAutoloadError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [summaryData, setSummaryData] = useState<{
    narrative: string
    resources: SummaryResource[]
  } | null>(null)

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
  const dismissAiError = useCallback((): void => setAiError(null), [])
  const dismissSummary = useCallback((): void => setSummaryData(null), [])

  const handleOpenSettingsFromBanner = useCallback((): void => {
    setShowMissingKeyBanner(false)
    setIsSettingsOpen(true)
  }, [])

  // A-12: Mode 1 — generate full concept map (nodes + edges) from focus question
  const handleGenerateMap = useCallback(async (): Promise<void> => {
    const apiKey = getApiKey()
    if (!apiKey) {
      openSettings()
      return
    }
    setIsGenerating(true)
    setAiError(null)
    setSummaryData(null)
    try {
      const response = await generateMap(focusQuestion, apiKey)
      // A-24: pass edges so autoLayout can use hierarchical BFS ordering
      const laid = autoLayout(
        response.nodes.map(n => ({ id: n.id, label: n.label, position: { x: 0, y: 0 } })),
        response.edges
      )
      const posMap = new Map(laid.map(n => [n.id, n.position]))
      canvasRef.current?.setMapData({
        nodes: response.nodes.map(n => ({
          id: n.id,
          label: n.label,
          position: posMap.get(n.id) ?? { x: 0, y: 0 },
          description: n.description, // A-23: pre-populate node description from AI
        })),
        edges: response.edges.map((e, i) => ({
          id: `e-${i}`,
          source: e.source,
          target: e.target,
          label: e.label,
        })),
        focusQuestion,
      })
      // A-16, A-18: show summary panel once map is rendered
      if (response.narrative) {
        setSummaryData({
          narrative: response.narrative,
          resources: response.resources ?? [],
        })
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Map generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [focusQuestion, openSettings])

  // A-13, A-14, A-15: Mode 2 — suggest concept nodes only, placed on outer ring
  const handleSuggestConcepts = useCallback(async (): Promise<void> => {
    const apiKey = getApiKey()
    if (!apiKey) {
      openSettings()
      return
    }
    setIsGenerating(true)
    setAiError(null)
    setSummaryData(null)
    try {
      const currentData = canvasRef.current?.getMapData()
      const existingNodes = currentData?.nodes ?? []
      const existingLabels = existingNodes.map(n => n.label)

      const result = await suggestConcepts(focusQuestion, existingLabels, apiKey)

      // A-14: filter concepts matching existing labels (case-insensitive)
      const existingLower = new Set(existingLabels.map(l => l.toLowerCase()))
      const novel = result.concepts.filter(s => !existingLower.has(s.label.toLowerCase()))

      if (novel.length === 0) return

      // A-13: distribute new nodes in a ring around the outer canvas area
      const positions = ringPositions(existingNodes, novel.length)

      // A-15: each node carries its AI-generated description
      canvasRef.current?.appendConceptNodes(
        novel.map((s, i) => ({
          id: `suggest-${crypto.randomUUID()}`,
          label: s.label,
          position: positions[i] ?? { x: i * 220, y: 0 },
          description: s.description,
        }))
      )

      // A-17, A-18: show summary panel once concepts are placed
      if (result.narrative) {
        setSummaryData({
          narrative: result.narrative,
          resources: result.resources,
        })
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Concept suggestion failed')
    } finally {
      setIsGenerating(false)
    }
  }, [focusQuestion, openSettings])

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
      <FocusQuestionBar
        value={focusQuestion}
        onChange={setFocusQuestion}
        onGenerateMap={(): void => {
          void handleGenerateMap()
        }}
        onSuggestConcepts={(): void => {
          void handleSuggestConcepts()
        }}
        isGenerating={isGenerating}
        aiError={aiError}
        onDismissError={dismissAiError}
        aiAssistEnabled={aiAssistEnabled}
      />
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <Canvas
          ref={canvasRef}
          onNodeCountChange={setNodeCount}
          focusQuestion={focusQuestion}
          aiAssistEnabled={aiAssistEnabled}
        />
        <AppMenu
          canvasRef={canvasRef}
          hasNodes={nodeCount > 0}
          focusQuestion={focusQuestion}
          onFocusQuestionLoad={setFocusQuestion}
          onOpenSettings={openSettings}
          autoloadError={autoloadError}
        />
        <SettingsPanel isOpen={isSettingsOpen} onClose={closeSettings} />
        <MissingKeyBanner
          isVisible={showMissingKeyBanner}
          onOpenSettings={handleOpenSettingsFromBanner}
          onDismiss={dismissBanner}
        />
        <HintTicker />
        {summaryData !== null && (
          <SummaryPanel
            narrative={summaryData.narrative}
            resources={summaryData.resources}
            onDismiss={dismissSummary}
          />
        )}
      </div>
    </div>
  )
}
