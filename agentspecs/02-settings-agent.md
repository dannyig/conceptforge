# Agent Spec: Settings Agent

**Agent:** Settings Agent
**Sequence:** 02 — runs after Scaffolder completes
**Trigger:** Human assigns requirement IDs K-01 → K-08
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

### Group 5 — UI Verification (Playwright MCP)

Before committing Group 4, start the dev server and use Playwright MCP + Chrome to verify:

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

*Settings Agent Spec v1.2 — March 2026 (added Group 4: AI Assist toggle K-05–K-08)*
