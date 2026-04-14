import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  AI_ASSIST_CHANGED_EVENT,
  API_KEY_CHANGED_EVENT,
  clearApiKey,
  getAiAssist,
  getApiKey,
  isValidApiKeyFormat,
  setAiAssist,
  setApiKey,
} from '@/lib/apiKey'
import {
  DEFAULT_CONCEPT_CHAT_PROMPT,
  getConceptChatPrompt,
  setConceptChatPrompt,
} from '@/lib/chatPrompts'
import {
  DEFAULT_EDGE_LABEL_PROMPT,
  getEdgeLabelPrompt,
  setEdgeLabelPrompt,
} from '@/lib/edgeLabelPrompts'
import { DEFAULT_URL_MAP_PROMPT, getUrlMapPrompt, setUrlMapPrompt } from '@/lib/urlMapPrompts'
import { CLAUDE_MODELS, type ClaudeModelId, getModel, setModel } from '@/lib/modelConfig'
import {
  clearJinaApiKey,
  getJinaApiKey,
  getJinaTokenBudget,
  setJinaApiKey,
  setJinaTokenBudget,
} from '@/lib/jinaFetch'
import { useTheme } from '@/hooks/use-theme'
import {
  FONT_FAMILY,
  FONT_SIZE_BASE,
  FONT_SIZE_SMALL,
  SETTINGS_PANEL_WIDTH,
  TRANSITION_FAST,
  TRANSITION_NORMAL,
  TRANSITION_PANEL,
} from '@/lib/theme'

type KeyStatus = 'empty' | 'saved' | 'error'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps): React.JSX.Element {
  const { theme, setTheme, tokens } = useTheme()
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<KeyStatus>(() => (getApiKey() ? 'saved' : 'empty'))
  const [errorMsg, setErrorMsg] = useState('')
  const [aiAssist, setAiAssistLocal] = useState<boolean>(() => getAiAssist())
  const [conceptChatPrompt, setConceptChatPromptLocal] = useState<string>(() =>
    getConceptChatPrompt()
  )
  const [edgeLabelPrompt, setEdgeLabelPromptLocal] = useState<string>(() => getEdgeLabelPrompt())
  const [urlMapPrompt, setUrlMapPromptLocal] = useState<string>(() => getUrlMapPrompt())
  const [jinaApiKeyDraft, setJinaApiKeyDraft] = useState<string>('')
  const [jinaApiKeySaved, setJinaApiKeySaved] = useState<boolean>(() => !!getJinaApiKey())
  const [jinaTokenBudget, setJinaTokenBudgetLocal] = useState<number>(() => getJinaTokenBudget())
  const [selectedModel, setSelectedModelLocal] = useState<ClaudeModelId>(() => getModel())
  const inputRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Sync status when key changes externally (e.g. cleared from another hook)
  useEffect((): (() => void) => {
    const syncKey = (): void => setStatus(getApiKey() ? 'saved' : 'empty')
    const syncAssist = (): void => setAiAssistLocal(getAiAssist())
    window.addEventListener(API_KEY_CHANGED_EVENT, syncKey)
    window.addEventListener(API_KEY_CHANGED_EVENT, syncAssist)
    window.addEventListener(AI_ASSIST_CHANGED_EVENT, syncAssist)
    return (): void => {
      window.removeEventListener(API_KEY_CHANGED_EVENT, syncKey)
      window.removeEventListener(API_KEY_CHANGED_EVENT, syncAssist)
      window.removeEventListener(AI_ASSIST_CHANGED_EVENT, syncAssist)
    }
  }, [])

  // Focus management — move focus into panel on open, restore on close
  useEffect((): void => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSave = useCallback((): void => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setErrorMsg('API key cannot be empty.')
      setStatus('error')
      return
    }
    if (!isValidApiKeyFormat(trimmed)) {
      setErrorMsg('Key must start with sk-ant- and be at least 20 characters.')
      setStatus('error')
      return
    }
    setApiKey(trimmed)
    setDraft('')
    setStatus('saved')
    setErrorMsg('')
  }, [draft])

  const handleClear = useCallback((): void => {
    clearApiKey()
    setDraft('')
    setStatus('empty')
    setErrorMsg('')
  }, [])

  const handleClose = useCallback((): void => {
    setDraft('')
    setErrorMsg('')
    onClose()
  }, [onClose])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') handleClose()
    },
    [handleClose]
  )

  const hasStoredKey = status === 'saved'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: tokens.COLOR_PANEL_OVERLAY,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: `opacity ${TRANSITION_PANEL}`,
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onKeyDown={onKeyDown}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: SETTINGS_PANEL_WIDTH,
          height: '100vh',
          backgroundColor: tokens.COLOR_PANEL_BG,
          borderLeft: `1px solid ${tokens.COLOR_NODE_BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : `translateX(${SETTINGS_PANEL_WIDTH})`,
          transition: `transform ${TRANSITION_PANEL}`,
          zIndex: 50,
          fontFamily: FONT_FAMILY,
          color: tokens.COLOR_NODE_TEXT,
        }}
      >
        {/* Scoped button hover styles */}
        <style>{`
          .cf-btn-primary:hover { background-color: ${tokens.COLOR_BUTTON_PRIMARY_HOVER_BG} !important; }
          .cf-btn-ghost:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
          .cf-btn-danger:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; color: ${tokens.COLOR_STATUS_ERROR} !important; }
          .cf-input:focus { border-color: ${tokens.COLOR_INPUT_FOCUS_BORDER} !important; outline: none; }
          .cf-settings-reset:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
          @media (prefers-reduced-motion: reduce) {
            .cf-btn-primary, .cf-btn-ghost, .cf-btn-danger, .cf-input { transition: none !important; }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${tokens.COLOR_NODE_BORDER}`,
          }}
        >
          <span style={{ fontSize: FONT_SIZE_BASE, fontWeight: '600' }}>Settings</span>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            aria-label="Close settings"
            className="cf-btn-ghost"
            style={{
              background: 'none',
              border: 'none',
              color: tokens.COLOR_TEXT_MUTED,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 4,
              fontSize: '18px',
              lineHeight: 1,
              transition: `background-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Section label */}
          <div>
            <span
              style={{
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '600',
              }}
            >
              Anthropic API Key
            </span>
          </div>

          {/* Status indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: FONT_SIZE_SMALL,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: hasStoredKey
                  ? tokens.COLOR_STATUS_SUCCESS
                  : tokens.COLOR_TEXT_MUTED,
                flexShrink: 0,
                transition: `background-color ${TRANSITION_NORMAL}`,
              }}
              aria-hidden="true"
            />
            <span
              style={{
                color: hasStoredKey ? tokens.COLOR_STATUS_SUCCESS : tokens.COLOR_TEXT_MUTED,
              }}
            >
              {hasStoredKey ? 'Key saved' : 'No key stored'}
            </span>
          </div>

          {/* Key input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              htmlFor="cf-api-key-input"
              style={{ fontSize: FONT_SIZE_SMALL, color: tokens.COLOR_TEXT_MUTED }}
            >
              {hasStoredKey ? 'Replace key' : 'Enter key'}
            </label>
            <input
              ref={inputRef}
              id="cf-api-key-input"
              type="password"
              className="cf-input"
              value={draft}
              onChange={e => {
                setDraft(e.target.value)
                if (status === 'error') setStatus(hasStoredKey ? 'saved' : 'empty')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
                e.stopPropagation()
              }}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              aria-label="Anthropic API key"
              aria-describedby={status === 'error' ? 'cf-key-error' : undefined}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: tokens.COLOR_INPUT_BG,
                border: `1px solid ${status === 'error' ? tokens.COLOR_STATUS_ERROR : tokens.COLOR_INPUT_BORDER}`,
                borderRadius: 6,
                color: tokens.COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                boxSizing: 'border-box',
                transition: `border-color ${TRANSITION_FAST}`,
              }}
            />
            {status === 'error' && (
              <span
                id="cf-key-error"
                role="alert"
                aria-live="polite"
                style={{ fontSize: FONT_SIZE_SMALL, color: tokens.COLOR_STATUS_ERROR }}
              >
                {errorMsg}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              className="cf-btn-primary"
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: tokens.COLOR_BUTTON_PRIMARY_BG,
                color: tokens.COLOR_BUTTON_PRIMARY_TEXT,
                border: 'none',
                borderRadius: 6,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                fontWeight: '600',
                cursor: 'pointer',
                transition: `background-color ${TRANSITION_FAST}`,
              }}
            >
              Save key
            </button>
            {hasStoredKey && (
              <button
                onClick={handleClear}
                className="cf-btn-danger"
                aria-label="Clear stored API key"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: tokens.COLOR_TEXT_MUTED,
                  border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
                  borderRadius: 6,
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZE_SMALL,
                  cursor: 'pointer',
                  transition: `background-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Help text */}
          <p
            style={{
              fontSize: FONT_SIZE_SMALL,
              color: tokens.COLOR_TEXT_MUTED,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Your key is stored only in your browser&apos;s localStorage and sent directly to{' '}
            <span style={{ color: tokens.COLOR_NODE_TEXT }}>api.anthropic.com</span>. It never
            touches any server.
          </p>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: tokens.COLOR_NODE_BORDER }} />

          {/* K-14: Claude Model selector */}
          <div>
            <span
              style={{
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '600',
              }}
            >
              Claude Model
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              htmlFor="cf-model-select"
              style={{ fontSize: FONT_SIZE_SMALL, color: tokens.COLOR_TEXT_MUTED }}
            >
              Model used for all AI operations
            </label>
            <select
              id="cf-model-select"
              value={selectedModel}
              onChange={(e): void => {
                const id = e.target.value as ClaudeModelId
                setSelectedModelLocal(id)
                setModel(id)
              }}
              aria-label="Claude model"
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: tokens.COLOR_INPUT_BG,
                border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
                borderRadius: 6,
                color: tokens.COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: `border-color ${TRANSITION_FAST}`,
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e7681' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: 32,
              }}
            >
              {CLAUDE_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: tokens.COLOR_NODE_BORDER }} />

          {/* T-01: Theme selector */}
          <div>
            <span
              style={{
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '600',
              }}
            >
              Appearance
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={(): void => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              style={{
                flex: 1,
                padding: '7px 0',
                backgroundColor:
                  theme === 'dark' ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_INPUT_BG,
                border: `1px solid ${theme === 'dark' ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_INPUT_BORDER}`,
                borderRadius: 6,
                color: theme === 'dark' ? '#ffffff' : tokens.COLOR_TEXT_MUTED,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                fontWeight: theme === 'dark' ? '600' : '400',
                cursor: 'pointer',
                transition: `background-color ${TRANSITION_FAST}, border-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
              }}
            >
              Dark
            </button>
            <button
              onClick={(): void => setTheme('light')}
              aria-pressed={theme === 'light'}
              style={{
                flex: 1,
                padding: '7px 0',
                backgroundColor:
                  theme === 'light' ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_INPUT_BG,
                border: `1px solid ${theme === 'light' ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_INPUT_BORDER}`,
                borderRadius: 6,
                color: theme === 'light' ? '#ffffff' : tokens.COLOR_TEXT_MUTED,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                fontWeight: theme === 'light' ? '600' : '400',
                cursor: 'pointer',
                transition: `background-color ${TRANSITION_FAST}, border-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
              }}
            >
              Light
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: tokens.COLOR_NODE_BORDER }} />

          {/* K-05: AI Assist toggle */}
          <div>
            <span
              style={{
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '600',
              }}
            >
              AI Assist
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: FONT_SIZE_SMALL,
                color: hasStoredKey ? tokens.COLOR_NODE_TEXT : tokens.COLOR_TEXT_MUTED,
                lineHeight: 1.5,
              }}
            >
              {aiAssist ? 'AI features enabled' : 'AI features disabled'}
            </span>
            <button
              role="switch"
              aria-checked={aiAssist}
              aria-label="Toggle AI Assist"
              disabled={!hasStoredKey}
              onClick={(): void => {
                if (!hasStoredKey) return
                const next = !aiAssist
                setAiAssist(next)
              }}
              style={{
                flexShrink: 0,
                position: 'relative',
                width: 40,
                height: 22,
                borderRadius: 11,
                border: 'none',
                backgroundColor: aiAssist ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_INPUT_BORDER,
                cursor: hasStoredKey ? 'pointer' : 'not-allowed',
                opacity: hasStoredKey ? 1 : 0.4,
                transition: `background-color ${TRANSITION_NORMAL}`,
                padding: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 3,
                  left: aiAssist ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  transition: `left ${TRANSITION_NORMAL}`,
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: tokens.COLOR_NODE_BORDER }} />

          {/* K-09: Concept Chat system prompt */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: FONT_SIZE_SMALL,
                  color: tokens.COLOR_TEXT_MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: '600',
                }}
              >
                Concept Chat
              </span>
              <button
                onClick={(): void => {
                  setConceptChatPromptLocal(DEFAULT_CONCEPT_CHAT_PROMPT)
                  setConceptChatPrompt(DEFAULT_CONCEPT_CHAT_PROMPT)
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontFamily: FONT_FAMILY,
                  fontSize: '10px',
                  color: tokens.COLOR_TEXT_MUTED,
                  cursor: 'pointer',
                  transition: `background-color ${TRANSITION_FAST}`,
                }}
                className="cf-settings-reset"
              >
                Reset to default
              </button>
            </div>
            <textarea
              value={conceptChatPrompt}
              onChange={(e): void => {
                setConceptChatPromptLocal(e.target.value)
                setConceptChatPrompt(e.target.value)
              }}
              aria-label="Concept Chat system prompt"
              rows={6}
              style={{
                width: '100%',
                background: tokens.COLOR_INPUT_BG,
                border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
                borderRadius: 4,
                color: tokens.COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: '11px',
                lineHeight: 1.6,
                padding: '8px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                transition: `border-color ${TRANSITION_FAST}`,
              }}
              onFocus={(e): void => {
                e.currentTarget.style.borderColor = tokens.COLOR_INPUT_FOCUS_BORDER
              }}
              onBlur={(e): void => {
                e.currentTarget.style.borderColor = tokens.COLOR_INPUT_BORDER
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: tokens.COLOR_NODE_BORDER }} />

          {/* K-10: Edge Label system prompt */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: FONT_SIZE_SMALL,
                  color: tokens.COLOR_TEXT_MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: '600',
                }}
              >
                Edge Label
              </span>
              <button
                onClick={(): void => {
                  setEdgeLabelPromptLocal(DEFAULT_EDGE_LABEL_PROMPT)
                  setEdgeLabelPrompt(DEFAULT_EDGE_LABEL_PROMPT)
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontFamily: FONT_FAMILY,
                  fontSize: '10px',
                  color: tokens.COLOR_TEXT_MUTED,
                  cursor: 'pointer',
                  transition: `background-color ${TRANSITION_FAST}`,
                }}
                className="cf-settings-reset"
              >
                Reset to default
              </button>
            </div>
            <textarea
              value={edgeLabelPrompt}
              onChange={(e): void => {
                setEdgeLabelPromptLocal(e.target.value)
                setEdgeLabelPrompt(e.target.value)
              }}
              aria-label="Edge Label system prompt"
              rows={6}
              style={{
                width: '100%',
                background: tokens.COLOR_INPUT_BG,
                border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
                borderRadius: 4,
                color: tokens.COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: '11px',
                lineHeight: 1.6,
                padding: '8px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                transition: `border-color ${TRANSITION_FAST}`,
              }}
              onFocus={(e): void => {
                e.currentTarget.style.borderColor = tokens.COLOR_INPUT_FOCUS_BORDER
              }}
              onBlur={(e): void => {
                e.currentTarget.style.borderColor = tokens.COLOR_INPUT_BORDER
              }}
            />
          </div>

          {/* K-13: URL Map Generation system prompt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: FONT_SIZE_SMALL,
                  color: tokens.COLOR_TEXT_MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: '600',
                }}
              >
                URL Map Generation
              </span>
              <button
                onClick={(): void => {
                  setUrlMapPromptLocal(DEFAULT_URL_MAP_PROMPT)
                  setUrlMapPrompt(DEFAULT_URL_MAP_PROMPT)
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontFamily: FONT_FAMILY,
                  fontSize: '10px',
                  color: tokens.COLOR_TEXT_MUTED,
                  cursor: 'pointer',
                  transition: `background-color ${TRANSITION_FAST}`,
                }}
                className="cf-settings-reset"
              >
                Reset to default
              </button>
            </div>
            <textarea
              value={urlMapPrompt}
              onChange={(e): void => {
                setUrlMapPromptLocal(e.target.value)
                setUrlMapPrompt(e.target.value)
              }}
              aria-label="URL Map Generation system prompt"
              rows={6}
              style={{
                width: '100%',
                background: tokens.COLOR_INPUT_BG,
                border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
                borderRadius: 4,
                color: tokens.COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: '11px',
                lineHeight: 1.6,
                padding: '8px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                transition: `border-color ${TRANSITION_FAST}`,
              }}
              onFocus={(e): void => {
                e.currentTarget.style.borderColor = tokens.COLOR_INPUT_FOCUS_BORDER
              }}
              onBlur={(e): void => {
                e.currentTarget.style.borderColor = tokens.COLOR_INPUT_BORDER
              }}
            />
          </div>

          {/* K-11, K-12: Jina.ai Reader settings for URL ingestion */}
          <div
            style={{
              borderTop: `1px solid ${tokens.COLOR_NODE_BORDER}`,
              paddingTop: 20,
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '600',
              }}
            >
              URL Ingestion (Jina.ai)
            </span>

            {/* K-11: optional Jina API key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZE_SMALL,
                  color: tokens.COLOR_TEXT_MUTED,
                }}
              >
                Jina API Key
                <span style={{ marginLeft: 6, fontSize: '10px', opacity: 0.6 }}>
                  (optional — free tier works without a key)
                </span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="password"
                  value={jinaApiKeyDraft}
                  onChange={(e): void => setJinaApiKeyDraft(e.target.value)}
                  placeholder={jinaApiKeySaved ? '••••••••••••' : 'jina_…'}
                  aria-label="Jina API key"
                  style={{
                    flex: 1,
                    background: tokens.COLOR_INPUT_BG,
                    border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
                    borderRadius: 4,
                    color: tokens.COLOR_NODE_TEXT,
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZE_SMALL,
                    padding: '6px 10px',
                    outline: 'none',
                    transition: `border-color ${TRANSITION_FAST}`,
                  }}
                  onFocus={(e): void => {
                    e.currentTarget.style.borderColor = tokens.COLOR_INPUT_FOCUS_BORDER
                  }}
                  onBlur={(e): void => {
                    e.currentTarget.style.borderColor = tokens.COLOR_INPUT_BORDER
                  }}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter') {
                      const trimmed = jinaApiKeyDraft.trim()
                      if (trimmed) {
                        setJinaApiKey(trimmed)
                        setJinaApiKeyDraft('')
                        setJinaApiKeySaved(true)
                      }
                    }
                  }}
                />
                {jinaApiKeyDraft.trim() && (
                  <button
                    onClick={(): void => {
                      const trimmed = jinaApiKeyDraft.trim()
                      if (trimmed) {
                        setJinaApiKey(trimmed)
                        setJinaApiKeyDraft('')
                        setJinaApiKeySaved(true)
                      }
                    }}
                    aria-label="Save Jina API key"
                    style={{
                      background: tokens.COLOR_BUTTON_PRIMARY_BG,
                      border: 'none',
                      borderRadius: 4,
                      color: tokens.COLOR_BUTTON_PRIMARY_TEXT,
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZE_SMALL,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      transition: `background-color ${TRANSITION_FAST}`,
                      flexShrink: 0,
                    }}
                  >
                    Save
                  </button>
                )}
                {jinaApiKeySaved && !jinaApiKeyDraft.trim() && (
                  <button
                    onClick={(): void => {
                      clearJinaApiKey()
                      setJinaApiKeyDraft('')
                      setJinaApiKeySaved(false)
                    }}
                    aria-label="Clear Jina API key"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
                      borderRadius: 4,
                      color: tokens.COLOR_TEXT_MUTED,
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZE_SMALL,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      transition: `background-color ${TRANSITION_FAST}`,
                      flexShrink: 0,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {jinaApiKeySaved && (
                <span
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: '11px',
                    color: tokens.COLOR_STATUS_SUCCESS,
                  }}
                >
                  Jina API key saved
                </span>
              )}
            </div>

            {/* K-12: token budget */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZE_SMALL,
                  color: tokens.COLOR_TEXT_MUTED,
                }}
              >
                Token Budget
                <span style={{ marginLeft: 6, fontSize: '10px', opacity: 0.6 }}>
                  (max tokens returned by Jina; default 10000)
                </span>
              </label>
              <input
                type="number"
                min={1000}
                max={100000}
                step={1000}
                value={jinaTokenBudget}
                onChange={(e): void => {
                  const n = parseInt(e.target.value, 10)
                  if (!isNaN(n) && n > 0) {
                    setJinaTokenBudgetLocal(n)
                    setJinaTokenBudget(n)
                  }
                }}
                aria-label="Jina token budget"
                style={{
                  width: 120,
                  background: tokens.COLOR_INPUT_BG,
                  border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
                  borderRadius: 4,
                  color: tokens.COLOR_NODE_TEXT,
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZE_SMALL,
                  padding: '6px 10px',
                  outline: 'none',
                  transition: `border-color ${TRANSITION_FAST}`,
                }}
                onFocus={(e): void => {
                  e.currentTarget.style.borderColor = tokens.COLOR_INPUT_FOCUS_BORDER
                }}
                onBlur={(e): void => {
                  e.currentTarget.style.borderColor = tokens.COLOR_INPUT_BORDER
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
