# Agent Spec: Persistence Agent

**Agent:** Persistence Agent
**Sequence:** 04 — runs after Canvas Agent completes
**Trigger:** Human assigns requirement IDs P-01 → P-08, E-01 → E-02, and C-13 (BranchingEdge persistence)
**Branch:** `feature/P-01-save-load-export`
**Depends on:** Canvas Agent (01) merged to main
**Parallel with:** AI Agent (03)
**Blocks:** QA Agent (05)

---

## Mission

Give users the ability to save their work and share it. When this agent is done, users can export their concept map as a JSON file, reload it later with full fidelity, and export the visual canvas as a full-resolution PNG. All file operations happen entirely in the browser — no server, no upload, no external storage.

---

## Input Documents

Read these in full before taking any action:

| Document | Path | Why |
|---|---|---|
| Requirements | `requirements/requirements.md` | Sections 4.5 (Persistence) and 4.6 (Export) |
| Agent instructions | `CLAUDE.md` | No-backend constraint, UI Verification gate |
| Shared types | `src/types/index.ts` | `MapData`, `ConceptNode`, `ConceptEdge` — the JSON save format |
| Canvas Agent output | `src/components/canvas/Canvas.tsx` | Understand how to read and restore canvas state |
| Dev method | `devmethod/devmethod.md` | Workflow steps including Playwright MCP gate |
| This spec | `agentspecs/04-persistence-agent.md` | Your task list |

---

## Deliverables

Complete all items below in order. Commit after each group.

> **Requirements gate — mandatory before writing any code:**
> If the human's request involves a **new requirement** or a **change to an existing requirement**, stop immediately and invoke the Requirements Agent (`/requirements`) before writing any implementation code. The Requirements Agent runs the Q&A, gets human approval, and commits on a `chore/requirements-*` branch. Only after that branch is merged to `main` does this agent proceed. Requirements documents (`requirements/requirements.md` and `requirements/requirements.html`) must never be updated as a side-effect of an implementation task — they are owned exclusively by the Requirements Agent.

> **Git protocol — mandatory before every commit and before raising a PR:**
> 1. **Branch check:** run `git branch --show-current` — output must NOT be `main`. If it is, stop. Switch to `feature/P-01-save-load-export` and re-stage changes before committing.
> 2. **Main alignment:** run `git fetch origin main && git merge origin/main --no-edit` before pushing and raising a PR. Resolve any conflicts, then re-run `pnpm lint && pnpm typecheck && pnpm test`. The branch must be zero commits behind `origin/main`.
> 3. **PR merge:** after opening the PR with `gh pr create`, stop. Never run `gh pr merge` or any equivalent. The human reviews and merges the PR.

---

### Group 1 — JSON Save and Load (P-01, P-02, P-03)

- [ ] Populate `src/lib/export.ts` with save/load functions:

  ```typescript
  // Save current map to a JSON file download
  export function saveMapToJson(data: MapData): void

  // Load a MapData object from a user-selected JSON file
  export function loadMapFromJson(): Promise<MapData>

  // Validate that a parsed object conforms to MapData shape
  export function validateMapData(raw: unknown): MapData
  ```

- [ ] `saveMapToJson`:
  - Serialises `MapData` to JSON (preserves all node positions, labels, types, edge data, and `focusQuestion`) (P-03, F-05)
  - Accepts a `filename` string parameter (without extension); appends `.json` before triggering the download
  - Creates a `Blob` and triggers a download via a temporary `<a>` element

- [ ] `loadMapFromJson`:
  - Opens a file picker (`<input type="file" accept=".json">`)
  - Reads the selected file with `FileReader`
  - Parses and validates against `MapData` using `validateMapData`
  - Returns the validated `MapData` — throws a typed error if invalid

- [ ] `validateMapData`:
  - Confirms `nodes` is an array of objects each with `id`, `label`, and `position.x/y`
  - Confirms `edges` is an array of objects each with `id`, `source`, and `target`
  - Accepts optional `focusQuestion` string field — valid whether present or absent (F-06)
  - Accepts optional `branchingEdges` array — if present, each entry must have `id`, `source` (string), `label` (string), and `targets` (string array); optional `labelPosition: { x, y }` (C-13)
  - Accepts optional `description` string on each node entry — valid whether present or absent (P-07)
  - Throws `Error('Invalid map file')` if validation fails

**Commit:** `feat(P-01,P-02,P-03): JSON save and load with MapData validation`

---

### Group 2 — PNG Export (E-01, E-02)

- [ ] Add PNG export to `src/lib/export.ts`:

  ```typescript
  // Export the full React Flow canvas as a PNG image
  export async function exportCanvasToPng(reactFlowInstance: ReactFlowInstance): Promise<void>
  ```

- [ ] Use `reactFlowInstance.toObject()` to capture the full graph (E-02 — full map, not just viewport)
- [ ] Use the React Flow built-in `getNodesBounds` + `getViewportForBounds` utilities to compute the full canvas bounds, then use `toPng` from `@xyflow/react` for raster export
- [ ] Default filename: `conceptforge-map-<YYYY-MM-DD>.png`
- [ ] Exported image must include all nodes and edges, not just those currently visible in the viewport (E-02)
- [ ] If the canvas is empty, show an inline message: `"Add nodes to the canvas before exporting"` — do not trigger a download of a blank image

**Commit:** `feat(E-01,E-02): full-canvas PNG export`

---

### Group 3 — URL Autoload (P-04, P-05, P-06)

- [ ] In `src/App.tsx`, add a `useEffect` that runs once on mount:
  - Reads `window.location.search` and extracts the `autoload` query parameter
  - Calls `history.replaceState({}, '', window.location.pathname)` immediately to strip the param from the URL bar (P-05)
  - Attempts to decode the value with `atob()` and parse as JSON
  - Passes the parsed value through `validateMapData()` (P-04)
  - On success: calls `canvasRef.current?.setMapData(mapData)` to load the map
  - On failure (decode error or validation failure): displays a visible error message inline, consistent with the existing load-error pattern in the toolbar (P-06)

- [ ] Error message copy: `"Could not load map from URL — the link may be invalid or corrupted."`

- [ ] The `?autoload=` handler must run before any analytics or other side effects fire — the `replaceState` call must be synchronous and first

**Commit:** `feat(P-04,P-05,P-06): URL autoload via ?autoload= base64 query parameter`

---

### Group 4 — Toolbar Integration

- [ ] Create or update `src/components/toolbar/Toolbar.tsx`:
  - "Save" button → calls `saveMapToJson` with current canvas `MapData`
  - "Load" button → calls `loadMapFromJson`, then replaces canvas state on success; shows error message on invalid file
  - "Export PNG" button → calls `exportCanvasToPng`; button shows loading state while export is generating
  - All buttons disabled when the canvas has no nodes (Save, Export PNG)
  - Error messages display inline in the toolbar — not in an alert/dialog

- [ ] Wire `Toolbar` into `src/App.tsx` alongside Canvas
- [ ] Canvas must expose its current `MapData` and a `loadMap(data: MapData)` setter — coordinate with Canvas Agent's output to confirm the interface (use props or a shared React context)
- [ ] On load, pass `focusQuestion` from the loaded `MapData` back to `App.tsx` so it restores in the `FocusQuestionBar` (F-06)

**Commit:** `feat: toolbar with save, load, and export PNG actions`

---

### Group 5 — Filename Prompt on Save (P-08)

- [ ] In `src/components/toolbar/Toolbar.tsx`, when the user clicks the Save button, display a filename prompt before writing any file:
  - Render an inline or modal prompt containing a labelled text input and a static `.json` suffix displayed immediately after (outside) the input field
  - On the first Save of a session the input is empty; on subsequent saves pre-populate it with the last successfully used filename
  - The confirm/save button is disabled while the input is empty
  - Cancelling the prompt closes it and aborts the save — no file is written
  - Confirming passes `<input-value>.json` as the filename to `saveMapToJson`
- [ ] Store the last-used filename in component state (not localStorage) — it persists only for the current session

**Commit:** `feat(P-08): filename prompt on save with session memory and .json suffix`

---

### Group 6 — UI Verification (Playwright MCP)

Before committing Group 5, start the dev server and use Playwright MCP + Chrome to verify:

- [ ] Opening `/?autoload=<valid base64 MapData>` loads the map automatically and the URL is immediately cleaned to `/`
- [ ] Opening `/?autoload=<invalid base64>` shows the error message and leaves the canvas empty
- [ ] Toolbar is visible with Save, Load, and Export PNG buttons
- [ ] Adding nodes to canvas, then clicking Save → filename prompt appears with empty input
- [ ] Entering a filename and confirming → file downloads as `<name>.json`; the `.json` suffix label is visible next to the input
- [ ] Clicking Save a second time → prompt pre-populates with the previously used filename
- [ ] Clicking Cancel on the filename prompt → no file downloads, canvas unchanged
- [ ] Confirm button is disabled while filename input is empty
- [ ] Clicking Load → file picker opens; selecting the previously saved file restores all nodes and edges with correct positions
- [ ] Loading an invalid JSON file → error message shown in toolbar, canvas unchanged
- [ ] Clicking Export PNG with nodes on canvas → PNG file downloads and visually contains all nodes
- [ ] Clicking Save or Export PNG with an empty canvas → buttons are disabled or show an appropriate message
- [ ] No errors in browser console

Log any issues as `/feedback` entries before committing.

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| `src/lib/export.ts` — JSON save/load and PNG export | Canvas node/edge CRUD — already done by Canvas Agent |
| `src/components/toolbar/Toolbar.tsx` | Claude API calls — that is the AI Agent |
| `MapData` serialisation and validation | Cloud storage, sync, or any network operation other than Claude API |

The `MapData` type is the save format. Do not invent a different format — the type contract is fixed.

---

## Output Checklist

When done, the following must exist:

```
src/
├── components/
│   └── toolbar/
│       └── Toolbar.tsx             ✓ Save, Load, Export PNG buttons wired
├── lib/
│   └── export.ts                   ✓ saveMapToJson, loadMapFromJson,
│                                      validateMapData, exportCanvasToPng
```

---

## Handoff

When this branch is merged to main, the QA Agent is closer to being fully unblocked:

- **QA Agent** → reads `agentspecs/05-qa-agent.md` — requires all feature agents merged

Run `/feedback` for any issues encountered. Run `/improve` if 3+ feedback entries are open.

---

*Persistence Agent Spec v1.3 — March 2026 (P-08: filename prompt on save — empty on first save, pre-populated on subsequent saves, .json suffix appended automatically)*
