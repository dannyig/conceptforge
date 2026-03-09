# Agent Spec: QA Agent

**Agent:** QA Agent
**Sequence:** 05 — runs after all feature agents complete
**Trigger:** Human assigns QA after Canvas, Settings, AI, and Persistence agents are all merged
**Branch:** `feature/QA-01-test-suite`
**Depends on:** Canvas Agent (01), Settings Agent (02), AI Agent (03), Persistence Agent (04) — all merged to main
**Blocks:** Nothing — this is the final gate before the MVP is considered complete

---

## Mission

Verify that ConceptForge works correctly, end-to-end, across all requirement areas. When this agent is done, the full test suite (unit + E2E) must pass in CI, all requirement IDs must have test coverage, a human-readable HTML test case document must exist with full requirement traceability, and a final Playwright MCP smoke test must confirm the live deployed app behaves correctly. The QA Agent does not write feature code — it writes tests, documents them, and raises feedback for any bugs found.

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

### Group 3 — Human-Readable E2E Test Case Document

Before writing any Playwright tests, produce a human-readable HTML document that defines every E2E test case in plain language with full traceability to requirement IDs. This document is the test plan — write it first, then implement it in Group 4.

- [ ] Create `tests/e2e-test-cases.html` — a **static HTML document** (plain HTML + inline CSS, no JavaScript framework or build step required)
- [ ] Style the document consistently with the project's existing HTML docs: copy the CSS block from `devmethod/devmethod.html` `<style>` section as a starting point (dark theme, `#0d1117` background, `#f97316` orange accent, `#c9d1d9` body text, monospace code elements)
- [ ] The document must have:
  - A **header** with title "ConceptForge — E2E Test Cases", version, and date
  - A **summary bar** showing total test count and counts by status (Pending / Pass / Fail) — updateable
  - One **section per feature area**: Canvas, Settings, AI, Persistence
  - A **Requirement Traceability Matrix** at the bottom

#### Test case table format (one table per feature area)

Each row in the table must contain:

| Column | Content |
|---|---|
| **Test ID** | `TC-{area}-{n}` — e.g. `TC-C-01`, `TC-K-02`, `TC-A-05`, `TC-P-03` |
| **Requirement ID(s)** | Comma-separated IDs from `requirements/requirements.md` — e.g. `C-02`, `A-06, A-07` |
| **Test Name** | Short imperative title — e.g. "Add node by double-clicking canvas" |
| **Description** | One sentence describing what the test does |
| **Preconditions** | What must be true before the test runs — e.g. "App is open, canvas is empty" |
| **Steps** | Numbered list of user actions |
| **Expected Result** | What the user should observe if the feature works correctly |
| **Status** | Badge: `Pending` (initial) → updated to `Pass` or `Fail` after smoke test |

#### Test IDs to define

Define one test case row for every Playwright test listed in Group 4 below. Test IDs must match 1:1 with Playwright `test()` descriptions so the document and the code stay in sync.

**Canvas (TC-C-01 → TC-C-08)**

| Test ID | Requirement | Test Name |
|---|---|---|
| TC-C-01 | C-01, V-01 | Canvas loads with dark background |
| TC-C-02 | C-02 | Add node by double-clicking canvas |
| TC-C-03 | C-03 | Edit node label — confirm with Enter |
| TC-C-04 | C-03 | Edit node label — cancel with Escape |
| TC-C-05 | C-04 | Delete node with Backspace key |
| TC-C-06 | C-05, V-03 | Draw edge between two nodes |
| TC-C-07 | C-06 | Zoom canvas with mouse wheel |
| TC-C-08 | C-07 | Minimap is visible on canvas load |

**Settings (TC-K-01 → TC-K-04)**

| Test ID | Requirement | Test Name |
|---|---|---|
| TC-K-01 | K-01 | Open settings panel via trigger button |
| TC-K-02 | K-02 | Save API key — panel shows Key saved |
| TC-K-03 | K-03 | AI action without key opens settings |
| TC-K-04 | K-04 | Clear API key — panel shows No key stored |

**AI (TC-A-01 → TC-A-07)**

| Test ID | Requirement | Test Name |
|---|---|---|
| TC-A-01 | A-01 | Prompt panel is visible on load |
| TC-A-02 | A-02, A-03 | Submit prompt — nodes render on canvas |
| TC-A-03 | A-04 | Loading state shown during AI request |
| TC-A-04 | A-05 | API error shown in UI not console |
| TC-A-05 | A-06 | Right-click node shows Expand option |
| TC-A-06 | A-07, A-08 | Expand node appends child nodes |
| TC-A-07 | A-09 | Re-expand node — no duplicate labels |

**Persistence (TC-P-01 → TC-P-05)**

| Test ID | Requirement | Test Name |
|---|---|---|
| TC-P-01 | P-01 | Save map triggers JSON download |
| TC-P-02 | P-02, P-03 | Load saved JSON restores canvas |
| TC-P-03 | P-02 | Load invalid JSON shows error |
| TC-P-04 | E-01 | Export PNG triggers image download |
| TC-P-05 | — | Save and export disabled on empty canvas |

#### Requirement Traceability Matrix

At the bottom of the HTML document, include a traceability matrix table:

| Requirement ID | Description | Test ID(s) | Status |
|---|---|---|---|
| C-01 | Interactive canvas | TC-C-01 | Pending |
| C-02 | Add nodes | TC-C-02 | Pending |
| … | … | … | … |

Cover all MVP requirement IDs (C-01→C-07, A-01→A-09, K-01→K-04, P-01→P-03, E-01→E-02, V-01, V-03).

#### Status badge rules

- **Pending** — initial state (grey badge) before smoke test
- **Pass** — updated after smoke test confirms the test passes (green badge)
- **Fail** — updated if the smoke test reveals the test fails (red badge) — also raise a `/feedback` entry

The QA Agent must update all status badges in `tests/e2e-test-cases.html` after completing the smoke test in Group 5.

**Commit:** `docs: create E2E test case document with requirement traceability`

---

### Group 4 — E2E Tests: Playwright

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

### Group 5 — Coverage Check, Smoke Test, and Document Update

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

- [ ] **Update `tests/e2e-test-cases.html` status badges** — after the smoke test, set every test case row to `Pass` or `Fail` based on observed results. Update the summary bar counts at the top. Commit the updated document alongside the smoke test findings.

**Commit:** `test: coverage check, smoke test complete, test case document updated with results`

---

## Mocking Rules

| What to mock | How |
|---|---|
| Claude API (`fetch` to `api.anthropic.com`) | `vi.mock` in unit tests; `page.route()` in Playwright |
| `localStorage` | `vi.spyOn(window.localStorage, ...)` or use `jsdom` reset between tests |
| File downloads | `URL.createObjectURL` + anchor click in unit tests; `page.waitForEvent('download')` in E2E |
| File picker | `FileReader` mock in unit tests; `page.on('filechooser')` in E2E |
| Real API key | **Never use one** — all tests use placeholder strings like `"test-api-key"` |
| Date / time | Mock `Date.now()` or `new Date()` to return fixed timestamps — ensures deterministic export filenames and any date-stamped output |

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
| `tests/e2e-test-cases.html` — test plan and results document | Adding features not covered by a requirement ID |
| Playwright MCP smoke test of the full happy path | Changing shared types in `src/types/index.ts` |
| Coverage reporting and gap analysis | Changing requirement descriptions in `requirements/requirements.md` |
| Logging `/feedback` for missing or incorrect types | Modifying `src/types/index.ts` directly — log feedback; the Improvement Agent applies type changes |

---

## Output Checklist

When done, the following must exist and pass:

```
tests/
├── unit/
│   ├── lib/
│   │   ├── apiKey.test.ts              ✓ passes
│   │   ├── claude.test.ts              ✓ passes
│   │   ├── export.test.ts              ✓ passes
│   │   └── graph.test.ts               ✓ passes (if applicable)
│   ├── components/
│   │   ├── settings/
│   │   │   └── SettingsPanel.test.tsx  ✓ passes
│   │   └── ai/
│   │       └── PromptPanel.test.tsx    ✓ passes
│   └── hooks/
│       └── useApiKey.test.ts           ✓ passes
├── e2e/
│   ├── canvas.spec.ts                  ✓ passes
│   ├── settings.spec.ts                ✓ passes
│   ├── ai.spec.ts                      ✓ passes
│   └── persistence.spec.ts             ✓ passes
└── e2e-test-cases.html                 ✓ exists, all statuses updated (Pass/Fail)
```

`pnpm test` — green. `pnpm test:e2e` — green. CI — green. Test case document complete with results. MVP complete.

---

## Handoff

When this branch is merged to main and CI is green:

- The **MVP is complete** — notify the human
- Run `/improve` to process any accumulated feedback before any post-MVP work begins
- The Improvement Agent will update `LESSONS.md` with patterns discovered during QA

---

*QA Agent Spec v1.1 — March 2026 (added Group 3: human-readable E2E test case document with requirement traceability)*
