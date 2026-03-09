# Agent Spec: QA Agent

**Agent:** QA Agent
**Sequence:** 05 — runs after all feature agents complete
**Trigger:** Human assigns QA after Canvas, Settings, AI, and Persistence agents are all merged
**Branch:** `feature/QA-01-test-suite`
**Depends on:** Canvas Agent (01), Settings Agent (02), AI Agent (03), Persistence Agent (04) — all merged to main
**Blocks:** Nothing — this is the final gate before the MVP is considered complete

---

## Mission

Verify that ConceptForge works correctly, end-to-end, across all requirement areas. When this agent is done, the full test suite (unit + E2E) must pass in CI, all requirement IDs must have test coverage, and a final Playwright MCP smoke test must confirm the live deployed app behaves correctly. The QA Agent does not write feature code — it writes tests and raises feedback for any bugs found.

---

## Input Documents

Read these in full before taking any action:

| Document | Path | Why |
|---|---|---|
| Requirements | `requirements/requirements.md` | Every requirement ID is a test target |
| Agent instructions | `CLAUDE.md` | Testing strategy, mock rules, quality gates |
| Shared types | `src/types/index.ts` | Types used in test fixtures |
| All feature agent output | `src/` | Read every file you will test before writing tests |
| Dev method | `devmethod/devmethod.md` | Understand the full quality gate picture |
| This spec | `agentspecs/05-qa-agent.md` | Your task list |

---

## Deliverables

Complete all items below in order. Commit after each group.

---

### Group 1 — Unit Tests: Library Functions

Write Vitest unit tests for all `src/lib/` modules. Mirror the source structure under `tests/unit/lib/`.

#### `tests/unit/lib/apiKey.test.ts`
- [ ] `getApiKey()` returns `null` when localStorage is empty
- [ ] `setApiKey()` stores the key at the correct localStorage key
- [ ] `getApiKey()` returns the stored value after `setApiKey()`
- [ ] `clearApiKey()` removes the stored value; `getApiKey()` returns `null` after clear
- [ ] Mock `localStorage` — do not use real browser storage in unit tests

#### `tests/unit/lib/export.test.ts`
- [ ] `validateMapData()` accepts a valid `MapData` object
- [ ] `validateMapData()` throws on missing `nodes` array
- [ ] `validateMapData()` throws on missing `edges` array
- [ ] `validateMapData()` throws on nodes with missing `id`, `label`, or `position`
- [ ] `validateMapData()` throws on edges with missing `id`, `source`, or `target`
- [ ] `saveMapToJson()` triggers a download (mock `URL.createObjectURL` and `<a>.click`)
- [ ] `loadMapFromJson()` resolves with a valid `MapData` when given a valid JSON blob (mock `FileReader`)
- [ ] `loadMapFromJson()` rejects with a typed error when given invalid JSON

#### `tests/unit/lib/claude.test.ts`
- [ ] `parseClaudeResponse()` accepts a valid `ClaudeMapResponse` object
- [ ] `parseClaudeResponse()` throws on a response with no `nodes` key
- [ ] `parseClaudeResponse()` throws on a response with no `edges` key
- [ ] `parseClaudeResponse()` throws on nodes missing `id` or `label`
- [ ] `generateMap()` calls `fetch` with the correct endpoint and `Authorization` header (mock `fetch`)
- [ ] `generateMap()` returns a parsed `ClaudeMapResponse` on a valid mocked response
- [ ] `generateMap()` throws a typed error when the API returns a non-200 status
- [ ] `expandNode()` includes `existingNodes` context in the prompt (inspect the mocked `fetch` body)
- [ ] **Never use a real API key in any test** — all Claude API tests mock `fetch`

**Commit:** `test: unit tests for apiKey, export, and claude lib modules`

---

### Group 2 — Unit Tests: Components and Hooks

Write Vitest + React Testing Library tests for key components and hooks. Mirror source under `tests/unit/components/` and `tests/unit/hooks/`.

#### `tests/unit/hooks/useApiKey.test.ts`
- [ ] `hasKey` is `false` when localStorage is empty
- [ ] `hasKey` is `true` after `setApiKey()` is called
- [ ] `openSettings` is a callable function

#### `tests/unit/components/settings/SettingsPanel.test.tsx`
- [ ] Renders in empty state when no key is stored
- [ ] Renders `Key saved` status when a key is present in localStorage
- [ ] Typing a value and clicking Save calls `setApiKey()` with the entered value
- [ ] Clicking Clear calls `clearApiKey()` and reverts UI to empty state
- [ ] API key input uses `type="password"` — verify attribute directly

#### `tests/unit/components/ai/PromptPanel.test.tsx`
- [ ] Submit button is disabled while a request is in progress
- [ ] Displays error message when `generateMap` rejects (mock `claude.ts`)
- [ ] Clears error on next submission
- [ ] Calls `openSettings()` when submitted without an API key

#### `tests/unit/lib/graph.test.ts` (if layout helpers are non-trivial)
- [ ] Auto-layout positions nodes without overlapping
- [ ] Returns positions for an empty node list without throwing

**Commit:** `test: unit tests for hooks and key components`

---

### Group 3 — E2E Tests: Playwright

Write Playwright E2E tests covering all requirement areas. Place tests in `tests/e2e/`. One spec file per feature area.

#### `tests/e2e/canvas.spec.ts` (C-01 → C-07)
- [ ] Canvas loads with dark background on app open (C-01, V-01)
- [ ] Double-clicking the canvas background creates a new node (C-02)
- [ ] Double-clicking a node enters edit mode; typing and pressing Enter changes the label (C-03)
- [ ] Pressing Escape during edit reverts the label (C-03)
- [ ] Selecting a node and pressing Backspace removes it from the canvas (C-04)
- [ ] Drawing an edge between two nodes creates a visible connection with an arrow (C-05, V-03)
- [ ] Mouse wheel zooms in and out (C-06)
- [ ] Minimap is visible (C-07)

#### `tests/e2e/settings.spec.ts` (K-01 → K-04)
- [ ] Settings trigger opens the settings panel (K-01)
- [ ] Entering a key and saving — panel shows `Key saved` on reopen (K-02)
- [ ] Triggering an AI action without a key stored opens the settings panel (K-03)
- [ ] Clearing the key — panel shows `No key stored` (K-04)

#### `tests/e2e/ai.spec.ts` (A-01 → A-09)
- [ ] Prompt panel is visible (A-01)
- [ ] Submitting a prompt with a mocked Claude response renders nodes on the canvas (A-02, A-03)
  - Mock the Claude API at the network level using Playwright's `page.route()`
- [ ] Loading state (button disabled + indicator) is shown during request (A-04)
- [ ] A mocked error response shows an error message in the UI — not just console (A-05)
- [ ] Right-clicking a node shows an Expand option (A-06)
- [ ] Expanding a node appends child nodes (A-07, A-08) — mock the expansion response
- [ ] Expanding the same node again does not create duplicate labels (A-09)

#### `tests/e2e/persistence.spec.ts` (P-01 → P-03, E-01 → E-02)
- [ ] Clicking Save with nodes on canvas triggers a file download (P-01)
- [ ] Loading the previously saved JSON file restores all nodes and edges (P-02, P-03)
  - Use Playwright's `page.on('filechooser')` to intercept the file picker
- [ ] Loading an invalid JSON file shows an error message — canvas is unchanged (P-02)
- [ ] Clicking Export PNG triggers a file download (E-01)
- [ ] Save and Export PNG buttons are disabled or show a message when canvas is empty (guard)

**Commit:** `test: Playwright E2E tests for canvas, settings, AI, and persistence`

---

### Group 4 — Coverage Check and Final Smoke Test

- [ ] Run `pnpm test --coverage` — review coverage report:
  - All functions in `src/lib/` must have ≥ 80% coverage
  - All component rendering paths (loading, error, empty, success) must have at least one test
  - Log a `/feedback` entry for any gap below threshold with a suggested fix

- [ ] Run `pnpm test:e2e` — all E2E tests must pass against the local dev server

- [ ] **Playwright MCP Smoke Test** — start the dev server and use Playwright MCP + Chrome to manually verify the full happy path end-to-end:
  1. Open the app — canvas loads
  2. Open Settings — enter an API key (use a test key) — save
  3. Enter a prompt — generate a map — nodes appear on canvas
  4. Right-click a node — expand it — child nodes appear
  5. Click Save — JSON file downloads
  6. Reload the page — click Load — select the saved JSON — canvas restores
  7. Click Export PNG — PNG file downloads and visually contains all nodes
  8. Confirm no console errors throughout

- [ ] If any smoke test step fails, raise a `/feedback` entry referencing the failing requirement ID and the observed behaviour before marking the spec complete

**Commit:** `test: coverage check and smoke test verification complete`

---

## Mocking Rules

| What to mock | How |
|---|---|
| Claude API (`fetch` to `api.anthropic.com`) | `vi.mock` in unit tests; `page.route()` in Playwright |
| `localStorage` | `vi.spyOn(window.localStorage, ...)` or use `jsdom` reset between tests |
| File downloads | `URL.createObjectURL` + anchor click in unit tests; `page.waitForEvent('download')` in E2E |
| File picker | `FileReader` mock in unit tests; `page.on('filechooser')` in E2E |
| Real API key | **Never use one** — all tests use placeholder strings like `"test-api-key"` |

---

## Bug Protocol

If a test reveals a bug in a feature agent's code:

1. Log a `/feedback` entry describing the bug, the requirement ID it violates, and the failing test
2. Do not fix feature code yourself — the QA Agent's scope is tests only
3. If the bug is critical (blocks other tests), note it as `severity: high`
4. After logging, continue writing remaining tests — do not stop
5. After all tests are written, notify the human that feedback entries are pending

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| Vitest unit tests for all `src/lib/` and key components | Writing or modifying feature code in `src/` |
| Playwright E2E tests for all requirement IDs | Fixing bugs found — raise feedback, let the relevant agent fix |
| Playwright MCP smoke test of the full happy path | Adding features not covered by a requirement ID |
| Coverage reporting and gap analysis | Changing shared types in `src/types/index.ts` |

---

## Output Checklist

When done, the following must exist and pass:

```
tests/
├── unit/
│   ├── lib/
│   │   ├── apiKey.test.ts          ✓ passes
│   │   ├── claude.test.ts          ✓ passes
│   │   ├── export.test.ts          ✓ passes
│   │   └── graph.test.ts           ✓ passes (if applicable)
│   ├── components/
│   │   ├── settings/
│   │   │   └── SettingsPanel.test.tsx  ✓ passes
│   │   └── ai/
│   │       └── PromptPanel.test.tsx    ✓ passes
│   └── hooks/
│       └── useApiKey.test.ts       ✓ passes
└── e2e/
    ├── canvas.spec.ts              ✓ passes
    ├── settings.spec.ts            ✓ passes
    ├── ai.spec.ts                  ✓ passes
    └── persistence.spec.ts         ✓ passes
```

`pnpm test` — green. `pnpm test:e2e` — green. CI — green. MVP complete.

---

## Handoff

When this branch is merged to main and CI is green:

- The **MVP is complete** — notify the human
- Run `/improve` to process any accumulated feedback before any post-MVP work begins
- The Improvement Agent will update `LESSONS.md` with patterns discovered during QA

---

*QA Agent Spec v1.0 — March 2026*
