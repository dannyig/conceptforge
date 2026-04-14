# Agent Spec: Settings Agent

**Agent:** Settings Agent
**Sequence:** 02 — runs after Scaffolder completes
**Trigger:** Human assigns requirement IDs K-01 → K-14 and/or T-01
**Branch:** `feature/K-01-api-key-settings`
**Depends on:** `chore/scaffold-project-setup` merged to main
**Parallel with:** Canvas Agent (01)
**Blocks:** AI Agent (03)

---

## Mission

Build the API key management panel. When this agent is done, users must be able to enter, store, clear, and update their Anthropic API key via a settings UI. The key must be stored only in localStorage and must be readable by the AI Agent's Claude API client. The Canvas Agent's work must not be touched.

---

## Input Documents

Read these in full before taking any action:

| Document | Path | Why |
|---|---|---|
| Requirements | `requirements/requirements.md` | Section 4.4 (API Key Management) |
| Agent instructions | `CLAUDE.md` | API Key Safety rules, UI Verification gate |
| Shared types | `src/types/index.ts` | Type contracts — do not alter |
| Dev method | `devmethod/devmethod.md` | Workflow steps including Playwright MCP gate |
| This spec | `agentspecs/02-settings-agent.md` | Your task list |

---

## Deliverables

Complete all items below in order. Commit after each group.

> **Requirements gate — mandatory before writing any code:**
> If the human's request involves a **new requirement** or a **change to an existing requirement**, stop immediately and invoke the Requirements Agent (`/requirements`) before writing any implementation code. The Requirements Agent runs the Q&A, gets human approval, and commits on a `chore/requirements-*` branch. Only after that branch is merged to `main` does this agent proceed. Requirements documents (`requirements/requirements.md` and `requirements/requirements.html`) must never be updated as a side-effect of an implementation task — they are owned exclusively by the Requirements Agent.

> **Git protocol — mandatory before every commit and before raising a PR:**
> 1. **Branch check:** run `git branch --show-current` — output must NOT be `main`. If it is, stop. Switch to `feature/K-01-api-key-settings` and re-stage changes before committing.
> 2. **Main alignment:** run `git fetch origin main && git merge origin/main --no-edit` before pushing and raising a PR. Resolve any conflicts, then re-run `pnpm lint && pnpm typecheck && pnpm test`. The branch must be zero commits behind `origin/main`.
> 3. **PR merge:** after opening the PR with `gh pr create`, stop. Never run `gh pr merge` or any equivalent. The human reviews and merges the PR.

> **Skills active for this agent:** When writing React component code, consult `vercel-react-best-practices` (apply rules from CLAUDE.md Section 11 caveat — skip `server-*` and hydration rules). Pay particular attention to `client-localstorage-schema` (localStorage versioning for the API key) and `rerender-*` rules. After completing Group 1, run `/web-design-guidelines src/components/settings/SettingsPanel.tsx` before committing — the settings panel must pass keyboard operability, focus indicator, and form behaviour checks.

---

### Group 1 — Settings Panel UI (K-01)

- [ ] Create `src/components/settings/SettingsPanel.tsx`:
  - Slide-in panel or modal — triggered by a settings icon button in the toolbar area
  - Contains a labelled password input for the Anthropic API key
  - "Save" button — stores key and closes panel
  - "Clear" button — removes stored key
  - Shows current key status: `Key saved` (masked) or `No key stored`
  - Panel must handle all four UI states: loading (checking storage), empty (no key), saved (key present), error (invalid key format)
- [ ] Create `src/components/toolbar/SettingsTrigger.tsx`:
  - Icon button that opens/closes the Settings panel
  - Mount this in `src/App.tsx` alongside the Canvas

**Commit:** `feat(K-01): settings panel UI with key input and status display`

---

### Group 2 — localStorage Key Management (K-02, K-04)

- [ ] Create `src/lib/apiKey.ts` — all localStorage operations for the API key:
  ```typescript
  const API_KEY_STORAGE_KEY = 'conceptforge:anthropic-api-key'

  export function getApiKey(): string | null
  export function setApiKey(key: string): void
  export function clearApiKey(): void
  ```
- [ ] Key is stored at `localStorage.setItem('conceptforge:anthropic-api-key', key)` (K-02)
- [ ] Key is never logged — not even partial characters (K-02)
- [ ] Clear button calls `clearApiKey()` and resets UI to empty state (K-04)
- [ ] Update button (re-saving with a new value) overwrites the existing stored key (K-04)

**Commit:** `feat(K-02,K-04): localStorage API key store, clear, and update`

---

### Group 3 — Missing Key Guard (K-03)

- [ ] Create `src/hooks/useApiKey.ts` — React hook:
  ```typescript
  export function useApiKey(): {
    apiKey: string | null
    hasKey: boolean
    openSettings: () => void
  }
  ```
- [ ] When the AI Agent (or any component) calls an AI action without a key stored:
  - Show an inline prompt or toast: `"Add your Anthropic API key in Settings to use AI features"`
  - The prompt includes a link/button that opens the Settings panel
- [ ] The guard must not block canvas interaction — only AI-triggered actions check for the key

**Commit:** `feat(K-03): missing API key guard with settings prompt`

---

### Group 4 — AI Assist Toggle (K-05, K-06, K-07, K-08)

- [ ] Add an "AI Assist" toggle switch to `SettingsPanel.tsx`, below the API key input field (K-05)
  - Default state: off on first use (no localStorage entry present)
  - Labelled clearly: "AI Assist"
- [ ] Persist the toggle state to `localStorage` under `conceptforge:ai-assist` (K-07)
  - On page load: if no API key is stored, force toggle to off regardless of persisted value
- [ ] Auto-enable the toggle when the user saves an API key; auto-disable when the key is cleared (K-06)
  - Wire this logic into the existing `setApiKey` / `clearApiKey` calls in `apiKey.ts`
- [ ] Expose the AI Assist state via `useApiKey.ts` (or a new `useAiAssist.ts` hook):
  ```typescript
  aiAssistEnabled: boolean
  ```
- [ ] When `aiAssistEnabled` is false, apply to AI-triggered controls (K-08):
  - Generate Map button: `opacity: 0.35`, `pointerEvents: 'none'`
  - Suggest Concepts button: `opacity: 0.35`, `pointerEvents: 'none'`
  - Expand node context menu item: `opacity: 0.35`, `pointerEvents: 'none'`
  - The focus question bar input and all canvas interactions remain fully active

**Commit:** `feat(K-05,K-06,K-07,K-08): AI Assist toggle in settings with key-linked automation and control dimming`

---

### Group 5 — Concept Chat System Prompt (K-09)

- [ ] Add a "Concept Chat" section to `SettingsPanel.tsx`, positioned below the AI Assist toggle:
  - Section heading: `"Concept Chat"` (labels the chat objective for future extensibility)
  - Multi-line `<textarea>` pre-filled with the default system prompt (defined as a constant in `src/lib/chatPrompts.ts`)
  - "Reset to default" button alongside the textarea — restores content to the default without requiring a separate save
- [ ] Create `src/lib/chatPrompts.ts`:
  ```typescript
  export const CONCEPT_CHAT_PROMPT_KEY = 'conceptforge:concept-chat-prompt'

  export const DEFAULT_CONCEPT_CHAT_PROMPT =
    'You are an expert knowledge assistant embedded in a concept mapping tool. ' +
    'Your role is to help the user deeply understand the concept they are exploring. ' +
    'Ground every response in the specific concept and its relationship to the focus question. ' +
    'Be concise, accurate, and educational — avoid tangents, excessive caveats, and generic advice. ' +
    'Prefer structured explanations with clear reasoning. When listing items, keep lists short and focused. ' +
    'Base all factual claims on credible sources and cite them inline. ' +
    'At the end of every response, provide a Resources section with up to 5 relevant links to authoritative sources.'

  export function getConceptChatPrompt(): string
  export function setConceptChatPrompt(prompt: string): void
  ```
- [ ] `getConceptChatPrompt`: reads from `localStorage`; returns the stored value if present, `DEFAULT_CONCEPT_CHAT_PROMPT` otherwise
- [ ] `setConceptChatPrompt`: writes to `localStorage` under `CONCEPT_CHAT_PROMPT_KEY`; if the value equals `DEFAULT_CONCEPT_CHAT_PROMPT`, store it anyway (explicit user action, not a side-effect)
- [ ] The textarea in Settings updates `localStorage` on every change (live persistence — no separate Save button required for the prompt)
- [ ] "Reset to default" sets the textarea value and writes `DEFAULT_CONCEPT_CHAT_PROMPT` to `localStorage`

**Commit:** `feat(K-09): concept chat system prompt in settings with default, edit, and reset`

---

### Group 6 — Claude Model Selector (K-14)

- [ ] Add a "Claude Model" label and `<select>` dropdown to `SettingsPanel.tsx`, positioned directly below the API key input (K-01) and above the AI Assist toggle (K-05)
- [ ] Offer exactly three `<option>` entries:
  - `claude-sonnet-4-6` — displayed as "Sonnet 4.6"
  - `claude-opus-4-6` — displayed as "Opus 4.6"
  - `claude-haiku-4-5-20251001` — displayed as "Haiku 4.5"
- [ ] Create `src/lib/modelConfig.ts`:
  ```typescript
  export const MODEL_CONFIG_KEY = 'conceptforge:claude-model'
  export const DEFAULT_MODEL = 'claude-sonnet-4-6'
  export const CLAUDE_MODELS = [
    { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
    { id: 'claude-opus-4-6', label: 'Opus 4.6' },
    { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
  ] as const
  export type ClaudeModelId = typeof CLAUDE_MODELS[number]['id']
  export function getModel(): ClaudeModelId
  export function setModel(id: ClaudeModelId): void
  ```
- [ ] `getModel`: reads from `localStorage`; returns the stored value if it is a valid model ID, `DEFAULT_MODEL` otherwise
- [ ] `setModel`: writes to `localStorage` under `MODEL_CONFIG_KEY`
- [ ] The dropdown in Settings updates `localStorage` on change (live persistence — no separate Save button required)
- [ ] Replace the hardcoded `MODEL` constant in `src/lib/claude.ts` with a call to `getModel()` at the start of every exported function that makes a Claude API call (generateMap, generateMapFromContent, suggestConcepts, expandNode, chatNode, suggestEdgeLabels, explainEdgeLabel, suggestEdgeConcepts)

**Commit:** `feat(K-14): Claude model selector in settings with localStorage persistence and apply to all API calls`

---

### Group 7 — Theme Selector (T-01)

- [ ] Add a "Theme" label and selector control (radio buttons or `<select>`) to `SettingsPanel.tsx`, positioned below the Claude Model selector (K-14) and above the AI Assist toggle (K-05); offer exactly two options: **Dark** and **Light**
- [ ] Create `src/hooks/use-theme.ts`:
  ```typescript
  export const THEME_STORAGE_KEY = 'conceptforge:theme'
  export type Theme = 'dark' | 'light'

  export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void }
  ```
  - On first call (no stored preference), read `window.matchMedia('(prefers-color-scheme: dark)').matches` to derive the default: `'dark'` if true, `'light'` otherwise
  - Persist the value to `localStorage` under `THEME_STORAGE_KEY` whenever it changes
  - On page load, restore the stored value if present; use the OS default only when no stored value exists
  - Return the current theme and a setter — the setter writes to `localStorage` and triggers a re-render
- [ ] Wire the Settings panel selector to call `setTheme` on change; the selector reflects the current theme value on open
- [ ] Export `useTheme` so the Canvas Agent and all other components can consume it to apply the active theme palette

**Commit:** `feat(T-01): theme selector in settings with OS-level default and localStorage persistence`

---

### Group 8 — UI Verification (Playwright MCP)

Start the dev server and use Playwright MCP + Chrome to verify:

- [ ] Settings trigger button is visible and clickable
- [ ] Settings panel opens on trigger click and closes on Save/Cancel
- [ ] Entering a key and clicking Save — panel shows `Key saved` on reopen
- [ ] Clicking Clear — panel returns to `No key stored` state
- [ ] Key value is never visible in plain text in the DOM or browser console
- [ ] Opening the app with a key already stored — settings shows `Key saved` immediately
- [ ] AI Assist toggle is visible in Settings panel below the API key field
- [ ] Toggle is off by default when no key is stored; cannot be switched on without a key
- [ ] Saving a key automatically switches the toggle on; clearing the key switches it off
- [ ] When toggle is off: Generate Map, Suggest Concepts, and Expand are visually dimmed and unclickable
- [ ] When toggle is on: all three controls are fully interactive
- [ ] Toggle state persists across page reloads (when key is present)
- [ ] Concept Chat system prompt section is visible in Settings below the AI Assist toggle
- [ ] Textarea is pre-filled with the default prompt text on first load
- [ ] Editing the textarea and reloading the page — custom prompt is restored
- [ ] Clicking "Reset to default" restores the default text in the textarea and in localStorage
- [ ] Claude Model selector is visible in Settings below the API key input and above the AI Assist toggle
- [ ] Dropdown shows three options: Sonnet 4.6, Opus 4.6, Haiku 4.5
- [ ] Selecting a model and reloading the page — selection is restored
- [ ] Theme selector is visible in Settings below the Claude Model selector
- [ ] Selector shows two options: Dark and Light
- [ ] Selecting Light switches the app to a light theme; selecting Dark switches back
- [ ] Selected theme persists across page reloads
- [ ] On a fresh session with no stored preference, the theme matches the OS `prefers-color-scheme` setting
- [ ] No errors in browser console

Log any visual or interaction issues found as `/feedback` entries before committing.

---

## API Key Safety Rules (non-negotiable)

These rules are restated here because violations are a security defect:

1. The key must only ever be passed to `api.anthropic.com` — never to any other host
2. Never log the key — not `console.log`, not `console.debug`, not even `key.slice(0, 4)`
3. Never store the key anywhere other than `localStorage` under `conceptforge:anthropic-api-key`
4. Never commit the key — not in test fixtures, not in environment files, not in comments
5. The password input must use `type="password"` so the browser masks it

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| Settings panel UI and localStorage key operations | Making any Claude API calls — that is the AI Agent |
| `useApiKey` hook for reading the stored key | Canvas node/edge management — that is the Canvas Agent |
| Missing key guard and settings open trigger | JSON save/load, PNG export — that is the Persistence Agent |

---

## Output Checklist

When done, the following must exist:

```
src/
├── components/
│   ├── settings/
│   │   └── SettingsPanel.tsx   ✓ full UI, all four states
│   └── toolbar/
│       └── SettingsTrigger.tsx ✓ icon button, mounts in App.tsx
├── hooks/
│   └── useApiKey.ts            ✓ hook returning key, hasKey, openSettings
├── lib/
│   └── apiKey.ts               ✓ getApiKey, setApiKey, clearApiKey
```

---

## Handoff

When this branch is merged to main, the AI Agent is unblocked (alongside Canvas Agent if not yet complete):

- **AI Agent** → reads `agentspecs/03-ai-agent.md` — requires both Canvas and Settings merged

Run `/feedback` for any issues encountered. Run `/improve` if 3+ feedback entries are open.

---

*Settings Agent Spec v1.4 — April 2026 (added Group 6: Claude Model selector K-14; modelConfig.ts; applied to all claude.ts API calls)*

*Settings Agent Spec v1.5 — April 2026 (added Group 7: T-01 theme selector; use-theme.ts hook with OS default detection, localStorage persistence; renamed old Group 7 to Group 8)*
