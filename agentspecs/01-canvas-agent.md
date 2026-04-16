# Agent Spec: Canvas Agent

**Agent:** Canvas Agent
**Sequence:** 01 — runs after Scaffolder completes
**Trigger:** Human assigns requirement IDs C-01 → C-43, V-01 → V-13, G-01 → G-12, B-01 → B-02, H-01 → H-06, and/or T-02 → T-03
**Branch:** `feature/C-01-react-flow-canvas`
**Depends on:** `chore/scaffold-project-setup` merged to main
**Parallel with:** Settings Agent (02)
**Blocks:** AI Agent (03), Persistence Agent (04)

---

## Mission

Build the interactive canvas that is the core of ConceptForge. When this agent is done, users must be able to view, add, edit, delete, and connect nodes on a fully functional React Flow canvas with dark styling. The canvas must be the foundation that the AI Agent and Persistence Agent can build on without structural changes.

---

## Input Documents

Read these in full before taking any action:

| Document | Path | Why |
|---|---|---|
| Requirements | `requirements/requirements.md` | Sections 4.1 (Canvas) and 4.7 (Visual Design) |
| Agent instructions | `CLAUDE.md` | Conventions, critical rules, UI Verification gate |
| Shared types | `src/types/index.ts` | `ConceptNode`, `ConceptEdge`, `MapData` — program to these |
| Dev method | `devmethod/devmethod.md` | Workflow steps including Playwright MCP gate |
| This spec | `agentspecs/01-canvas-agent.md` | Your task list |

---

## Deliverables

Complete all items below in order. Commit after each group.

> **Requirements gate — mandatory before writing any code:**
> If the human's request involves a **new requirement** or a **change to an existing requirement**, stop immediately and invoke the Requirements Agent (`/requirements`) before writing any implementation code. The Requirements Agent runs the Q&A, gets human approval, and commits on a `chore/requirements-*` branch. Only after that branch is merged to `main` does this agent proceed. Requirements documents (`requirements/requirements.md` and `requirements/requirements.html`) must never be updated as a side-effect of an implementation task — they are owned exclusively by the Requirements Agent.

> **Git protocol — mandatory before every commit and before raising a PR:**
> 1. **Branch check:** run `git branch --show-current` — output must NOT be `main`. If it is, stop. Switch to `feature/C-01-react-flow-canvas` and re-stage changes before committing.
> 2. **Main alignment:** run `git fetch origin main && git merge origin/main --no-edit` before pushing and raising a PR. Resolve any conflicts, then re-run `pnpm lint && pnpm typecheck && pnpm test`. The branch must be zero commits behind `origin/main`.
> 3. **PR merge:** after opening the PR with `gh pr create`, stop. Never run `gh pr merge` or any equivalent. The human reviews and merges the PR.

---

> **Skills active for this agent:** Before writing any React component code, consult the `vercel-react-best-practices` skill (`.claude/skills/vercel-react-best-practices/SKILL.md`) — apply the rules marked applicable in CLAUDE.md Section 11. Pay particular attention to: `rerender-*` rules (React Flow state triggers frequent re-renders), `rendering-animate-svg-wrapper` (edges are SVG), `rendering-svg-precision`, and `rendering-hoist-jsx`.

### Group 1 — React Flow Canvas Foundation (C-01, C-06, C-07)

- [ ] Create `src/components/canvas/Canvas.tsx` — wraps `<ReactFlow>` with:
  - `nodes` and `edges` state managed via `useNodesState` / `useEdgesState`
  - `onNodesChange` / `onEdgesChange` handlers wired to React Flow
  - `fitView` on mount
- [ ] Enable pan and zoom (C-06) — React Flow default behaviour, confirm not disabled
- [ ] Add `<MiniMap>` component (C-07) — positioned bottom-right, styled to dark theme
- [ ] Add `<Controls>` component — zoom in/out/fit buttons
- [ ] Add `<Background>` component — dots pattern, dark colour
- [ ] Export `MapData` from Canvas via a `ref` or callback prop — required by Persistence Agent
- [ ] Mount `<Canvas />` in `src/App.tsx` replacing the placeholder

**Commit:** `feat(C-01): add React Flow canvas with pan, zoom, minimap and controls`

---

### Group 2 — Node CRUD (C-02, C-03, C-04)

- [ ] Double-click on canvas background → add a new node at click position (C-02)
  - New node gets a generated `id` (`crypto.randomUUID()`)
  - Default label: `"New concept"`
  - Default type: `"concept"`
- [ ] Inline label editing (C-03):
  - Double-click an existing node to enter edit mode
  - Edit confirmed on Enter or blur
  - Edit cancelled on Escape (reverts to previous label)
  - Use a custom node component in `src/components/canvas/ConceptNode.tsx`
- [ ] Delete node (C-04):
  - Select node → press Backspace or Delete key removes it
  - Deleting a node also removes all edges connected to it
- [ ] Delete edge (C-04):
  - Select edge → press Backspace or Delete key removes it

**Commit:** `feat(C-02,C-03,C-04): node add, inline edit, and delete`

---

### Group 3 — Edge Drawing (C-05)

- [ ] Enable user-drawn edges by connecting node handles (C-05)
  - Use React Flow's built-in `onConnect` handler
  - New edges get a generated `id`
- [ ] Edges render with directional arrows (V-03) — use `MarkerType.ArrowClosed`
- [ ] Prevent self-connections (source === target)

**Commit:** `feat(C-05,V-03): manual edge drawing with directional arrows`

---

### Group 4 — Visual Design (V-01, V-02, V-04)

#### Colour tokens (V-01)

- [ ] Create `src/lib/theme.ts` — exports every design token as a named constant. No component hardcodes a value:

```ts
// Colour tokens
export const COLOR_CANVAS_BG       = '#0d1117'
export const COLOR_NODE_BG         = '#161b22'
export const COLOR_NODE_BORDER     = '#30363d'
export const COLOR_NODE_TEXT       = '#e6edf3'
export const COLOR_NODE_SELECTED   = '#f97316'
export const COLOR_NODE_GLOW       = 'rgba(249,115,22,0.25)'  // selected glow
export const COLOR_EDGE            = '#4b5563'
export const COLOR_EDGE_SELECTED   = '#f97316'
export const COLOR_HANDLE          = '#4b5563'
export const COLOR_HANDLE_HOVER    = '#f97316'
export const COLOR_BG_DOT          = '#21262d'  // Background dot colour

// Background dot geometry
export const BG_DOT_SIZE  = 1.5
export const BG_DOT_GAP   = 24

// Typography
export const FONT_FAMILY  = "'JetBrains Mono', 'Fira Code', monospace"  // monospace for the technical/code aesthetic
export const FONT_SIZE_NODE_LABEL = '13px'
export const FONT_WEIGHT_NODE_LABEL = '500'

// Motion — all transitions use these timings
export const TRANSITION_FAST   = '100ms ease'
export const TRANSITION_NORMAL = '180ms ease'
```

#### Node visual quality (V-01, V-02)

- [ ] `ConceptNode.tsx` renders with:
  - Border-radius: `6px` — angular enough to feel technical, not pill-shaped
  - Padding: `10px 16px`
  - Min-width: `120px`
  - Font: `FONT_FAMILY`, `FONT_SIZE_NODE_LABEL`, `FONT_WEIGHT_NODE_LABEL`
  - Default state: `COLOR_NODE_BG` background, `COLOR_NODE_BORDER` border (1px solid)
  - **Hover state:** border transitions to `COLOR_NODE_SELECTED` at 60% opacity (`TRANSITION_FAST`) — nodes must visibly respond to pointer without being selected
  - **Selected state:** border `COLOR_NODE_SELECTED` (full opacity) + `box-shadow: 0 0 0 3px COLOR_NODE_GLOW` — the glow makes selection unmistakable
  - All transitions use `TRANSITION_NORMAL` unless specified otherwise
  - No overflow clipping — labels expand the node vertically before truncating

#### Canvas atmosphere

- [ ] `<Background>` uses `BackgroundVariant.Dots` with:
  - `color={COLOR_BG_DOT}`, `size={BG_DOT_SIZE}`, `gap={BG_DOT_GAP}` — all from `theme.ts`
  - Do not use React Flow's default dot size or colour — they are too subtle on dark backgrounds

#### Edge handles

- [ ] Connection handles (`<Handle>`) render at `8px` diameter
  - Default: `COLOR_HANDLE`, 1px border same colour
  - Hover: fill transitions to `COLOR_HANDLE_HOVER` (`TRANSITION_FAST`)

#### Layout

- [ ] Responsive layout — canvas fills the viewport, usable at 1280px+ (V-04)

#### Anti-slop verification

Before committing Group 4, visually confirm all of the following are absent:
- [ ] No purple, indigo, or blue accent colours anywhere
- [ ] No soft drop-shadows with large blur radius
- [ ] No gradient fills on nodes or backgrounds
- [ ] No border-radius above `8px` on nodes
- [ ] No font from the Inter / Roboto / Arial family

**Commit:** `feat(V-01,V-02,V-04): dark theme, token system, micro-interactions, node and canvas atmosphere`

---

### Group 4b — Edge Label Captions (C-08, C-09)

- [ ] Create `src/components/canvas/ConceptEdge.tsx` — custom edge component that:
  - Renders the edge `label` as a text element centred on the edge path, always visible (C-08)
  - Uses `FONT_FAMILY`, `FONT_SIZE_NODE_LABEL` from `theme.ts` for the label
  - Label background: a small rect using `COLOR_NODE_BG` to ensure readability against the canvas background
  - Label text colour: `COLOR_NODE_TEXT`
- [ ] Register `ConceptEdge` as the default edge type in Canvas — all edges (AI-generated and manually drawn) use it
- [ ] Double-clicking an edge enters inline caption edit mode (C-09):
  - Replace the label text with an `<input>` in place, pre-filled with the current label (or empty)
  - Confirm on Enter or blur — updates `edges` state via `setEdges`
  - Cancel on Escape — reverts to previous label
  - `stopPropagation` on input keydown to prevent React Flow delete handler from firing
- [ ] New manually drawn edges start with an empty label (no caption until user sets one)

**Commit:** `feat(C-08,C-09): edge label captions with inline editing`

---

### Group 4c — Branching Edges (C-10 → C-17)

> **Before starting this group:** Add a `BranchingEdge` type to `src/types/index.ts` and extend `MapData` with `branchingEdges?: BranchingEdge[]` before writing any component code. Programme to the type contract, not the implementation.

```typescript
// src/types/index.ts additions
interface BranchingEdge {
  id: string
  source: string           // source node ID
  label: string            // shared relationship label
  targets: string[]        // ordered list of target node IDs
  labelPosition?: { x: number; y: number }  // draggable hub position
}

// MapData extended:
interface MapData {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  branchingEdges?: BranchingEdge[]
  focusQuestion?: string
}
```

- [ ] Right-click context menu on an edge label → show "Branch" option (C-10)
  - Only enabled when the edge already has a label
  - Selecting "Branch" converts the `ConceptEdge` into a `BranchingEdge` in state
  - The original `ConceptEdge` is removed from `edges`; the new `BranchingEdge` is added to `branchingEdges`
- [ ] Create `src/components/canvas/BranchingEdge.tsx` — custom component that renders (C-11):
  - A single line from the source node to the label hub (rendered as a draggable, styled element)
  - Individual directional arrows from the label hub to each target node
  - Label hub styled consistently with edge labels in `ConceptEdge` (same font `FONT_SIZE_EDGE_LABEL`, background, colours)
  - Hub exposes handles distributed around its full boundary — all visually hidden (opacity 0) at all times; no visible bottom handle
  - Stem edge attaches to the hub side nearest the source node; each branch arrow attaches to the hub side nearest its target node; both recompute dynamically on position change (C-11)
- [ ] Label hub double-click → inline label edit (same pattern as C-09 — Enter/blur confirms, Escape cancels) (C-09 parity)
- [ ] User hovers near hub boundary → connection handle becomes visible; drag from handle to existing node adds it to `targets`; drag to empty canvas creates and connects a new node (C-12)
- [ ] When `targets.length` drops to 1 (via branch deletion), auto-convert back to a `ConceptEdge` (C-14)
- [ ] Deleting the source→hub segment or the hub itself removes the entire `BranchingEdge` from state; all target nodes remain on canvas (C-16)
- [ ] Deleting an individual hub→target arrow removes only that target from `targets` (C-16)
- [ ] Target nodes may be dragged freely; branch arrows update to follow (C-15)
- [ ] Label hub is draggable — updates `labelPosition` in state; stem edge and all branch arrows redraw, each re-attaching to the hub side nearest their respective source or target node (C-17)
- [ ] Register `BranchingEdge` state alongside `edges` in `Canvas.tsx`; expose via `CanvasHandle.getMapData()` and restore via `CanvasHandle.setMapData()`

**Commit:** `feat(C-10–C-17): branching edges with fan-out rendering, hub drag, and partial delete`

---

### Group 4d — Visual Refinements (V-05, V-06, V-07, V-08)

- [ ] **V-05 — Node label centering:** Ensure the node label text in `ConceptNode.tsx` is horizontally centred within the node. The label container must use `text-align: center` and `width: 100%` so labels of any length are centred regardless of node width.
- [ ] **V-06 — Edge label border removal and fixed font size:**
  - In `ConceptEdge.tsx` and `BranchHubNode.tsx`, remove the visible border/stroke from label elements — kept for readability but must have no visible border
  - Edge label and hub label font size must be `9px` — use `FONT_SIZE_EDGE_LABEL = '9px'` from `theme.ts` in both components
  - Keep the `COLOR_NODE_BG` background fill so labels remain readable against the canvas
- [ ] **V-07 — Empty canvas hint:**
  - In `Canvas.tsx`, render a centred, low-opacity hint text `"Double click to start"` on the canvas background when `nodes.length === 0`
  - Hide it as soon as any node is added; re-show if all nodes are deleted
  - Style: `opacity: 0.25`, `FONT_FAMILY`, `FONT_SIZE_NODE_LABEL`, `COLOR_NODE_TEXT`, `pointer-events: none`
  - Position: `position: absolute`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`
- [ ] **V-08 — fitView padding:**
  - In `Canvas.tsx`, add `fitViewOptions={{ padding: 0.4 }}` (or similar value that gives one natural step back) to the `<ReactFlow>` component so nodes render noticeably smaller than the viewport on load

**Commit:** `feat(V-05,V-06,V-07,V-08): node label centering, edge label styles, empty canvas hint, fitView padding`

---

### Group 4e — Flexible Handles and Edge-Drop Node Creation (C-18, C-19)

- [ ] **C-18 — Four-sided handles, all invisible, occupation-gated sourcing:**
  - In `ConceptNode.tsx`, render four `<Handle>` elements — one per side (top, right, bottom, left) — each with `opacity: 0` at all times
  - All four handles support `type="target"` (receive incoming edges) with no limit on how many edges per side
  - A handle may also act as a source (`type="source"`) only when it has no incoming edges currently connected to it
  - Implement a `isValidConnection` or `onConnectStart`/`onConnectEnd` guard (or use React Flow's `isValidConnection` prop on `<Handle>`) to prevent a handle from being used as a source when it already has an incoming edge
  - No handle is ever visible — do not render hover effects or coloured dots on any handle
- [ ] **C-19 — Edge-drop creates a new node:**
  - In `Canvas.tsx`, implement an `onConnectEnd` handler on `<ReactFlow>`
  - When a drag from any handle is dropped on the canvas pane (not on an existing node), read the drop coordinates from the event, create a new node at that position with a blank label, connect the source node to the new node with a new edge, and immediately place the new node into inline edit mode (same state as double-clicking empty canvas — C-02/C-03)
  - If the connection is dropped on an existing node, let React Flow's normal `onConnect` handle it — do not interfere

**Commit:** `feat(C-18,C-19): flexible four-sided handles and edge-drop node creation`

---

### Group 4f — Repositionable Single Edge Label Waypoint (C-20, C-21, C-22)

> **Before starting this group:** Extend `ConceptEdge` in `src/types/index.ts` with `labelPosition?: { x: number; y: number }` before writing any component code.

- [ ] **C-20 — Draggable label waypoint:**
  - In `ConceptEdge.tsx`, when `label` is non-empty, make the label element draggable (use `useDraggable`-style pointer events or a React Flow node approach)
  - While dragging, update a `labelPosition` state value stored on the edge's `data`
  - Cursor must be `grab` at rest and `grabbing` during drag
  - Label styling remains unchanged: borderless, `FONT_SIZE_EDGE_LABEL` (9px), `COLOR_NODE_TEXT` (V-06)
  - Dragging is only available when the edge has a label — unlabelled edges have no draggable target
- [ ] **C-21 — Two-segment routing when repositioned:**
  - When `data.labelPosition` is set (label has been moved from default), render the edge as two separate SVG paths:
    - Segment 1: source node → label position, straight line, no arrowhead
    - Segment 2: label position → target node, straight line, with `MarkerType.ArrowClosed`
  - When `data.labelPosition` is unset (default midpoint), render as a single straight segment (existing behaviour)
  - Both segments must follow V-03 (straight lines, no bezier paths)
  - Both segments update in real time as source node, target node, or label waypoint is moved
- [ ] **C-22 — Persistence:**
  - `labelPosition` is included in `ConceptEdge` data saved by `getMapData()` and restored by `setMapData()`
  - P-03 is satisfied: the edge's custom label position survives a JSON save/load round-trip
  - When a map is loaded with a repositioned label, the two-segment routing is restored immediately

**Commit:** `feat(C-20,C-21,C-22): repositionable single edge label waypoint with two-segment routing`

---

### Group 4g — Notes & Groups (G-01 → G-12)

> **Before starting this group:** Add `NoteData` to `src/types/index.ts` and extend `MapData` with `notes?: NoteData[]` before writing any component code.

```typescript
// src/types/index.ts additions
interface NoteData {
  id: string
  position: { x: number; y: number }
  width: number
  height: number
  backgroundColor: string   // one of the 10 predefined palette values
  text?: string
  textSize?: 'small' | 'medium' | 'large'
}

// MapData extended:
interface MapData {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  branchingEdges?: BranchingEdge[]
  notes?: NoteData[]          // G-10: absent when map has none
  focusQuestion?: string
}
```

- [ ] **G-01 — Pane right-click context menu:**
  - In `Canvas.tsx`, add an `onPaneContextMenu` handler to `<ReactFlow>` that shows a small menu at the cursor position with two items: "Add Node" and "Add Note"
  - "Add Node" creates a concept node at the cursor position (same as double-click — C-02); dismiss the menu
  - "Add Note" creates a note at the cursor position with a default background colour; dismiss the menu
  - Menu is dismissed on any click outside it or on Escape
  - Double-click to create a node (C-02) is unchanged
- [ ] **G-02 — Notes render behind nodes and edges:**
  - Implement notes as a React Flow node type (`type: 'note'`) with `zIndex: -1` so they always render behind all nodes and edges
  - Create `src/components/canvas/NoteNode.tsx` as the custom node component
  - The `zIndex: -1` must never be changed — not during text editing, not during any other interaction (G-02 z-index invariant)
- [ ] **G-03 — Hover-triggered resize handles:**
  - The note element must be resizable by dragging any of its four corners or four edge midpoints
  - Use React Flow's `NodeResizer` from `@xyflow/react`
  - Resize handles are **always** shown when the cursor is over the note — no selection step required; `isVisible` should be controlled by hover state, not `selected`
  - Minimum dimensions: 80×60px
- [ ] **G-04 — Reposition by dragging body:**
  - React Flow handles drag-to-reposition natively for node types; ensure the note body is draggable (no `nodrag` class on the body area)
- [ ] **G-05 — Background colour picker (via Edit Note):**
  - The 10-colour palette swatch grid is shown inside the "Edit Note" panel triggered from the note's right-click context menu (G-11), not as a direct right-click top-level menu
  - Selecting a colour updates the note's `backgroundColor` in state immediately
  - Predefined palette: `#854d0e`, `#166534`, `#1e3a5f`, `#4a1942`, `#7f1d1d`, `#134e4a`, `#3b2f00`, `#1c1c3a`, `#2d1b00`, `#1a2e1a`
  - Default colour on creation: `#1e3a5f` (dark blue); current colour highlighted in the palette
- [ ] **G-06 — Text size picker (via Edit Note):**
  - The text size selector (Small 11px / Medium 14px / Large 18px) is shown inside the "Edit Note" panel triggered from the note's right-click context menu (G-11), not as a direct right-click top-level menu
  - Selecting a size updates the note's `textSize` in state immediately
  - Default text size on creation: Medium (14px)
- [ ] **G-07 — Double-click behaviour:**
  - Double-clicking on the note's **background** (not the text span) creates a new concept node at the cursor position — identical to double-clicking empty canvas (C-02)
  - Double-clicking on the note's **existing text content** enters inline text-edit mode using a `<textarea>` for multi-line text
  - Text is anchored to the top-left of the note interior with padding
  - Confirm on blur; cancel on Escape (reverts to previous text)
  - If the note has no text, display a low-opacity placeholder: `"Double-click to add text…"`
- [ ] **G-08 — Auto-contrasting text colour:**
  - Compute text colour programmatically from the note's `backgroundColor` using perceived luminance (`0.299R + 0.587G + 0.114B`)
  - Use `#f0f6fc` for dark backgrounds and `#0d1117` for light backgrounds
  - Apply this colour to both the note text and any placeholder text
- [ ] **G-09 — Delete note via context menu:**
  - "Delete Note" in the note's right-click context menu (G-11) removes the note from canvas state
  - Notes do **not** respond to Delete/Backspace keyboard events (selection is disabled per G-12)
- [ ] **G-10 — Persistence:**
  - In `Canvas.tsx`, extend `getMapData()` to include notes in the returned `MapData`
  - Extend `setMapData()` to restore notes from `MapData.notes`, recreating their RF node representation with `zIndex: -1`
- [ ] **G-11 — Note right-click context menu:**
  - In `Canvas.tsx`, add an `onNodeContextMenu` handler that fires when a note node is right-clicked
  - Show a menu at the cursor position with four items: "Add Node", "Add Note", "Edit Note", "Delete Note"
  - "Add Node" and "Add Note" behave identically to the pane menu (G-01) — create at cursor position
  - "Edit Note" opens the colour palette + text size controls inline in the same menu panel (matching the layout from G-05/G-06)
  - "Delete Note" removes the note immediately; dismiss the menu
  - Menu dismissed on outside click or Escape
- [ ] **G-12 — Notes not selectable via single click:**
  - Set `selectable: false` on note RF nodes so single left-click does not apply any selection state
  - Notes must not receive a selection border or any visual selection indicator on click
  - Drag-to-reposition (G-04) and resize (G-03) must still work normally

**Commit:** `feat(G-01–G-12): notes and groups — refined interaction model with note context menu, hover resize, double-click routing, and non-selectable notes`

---

### Group 4h — App Version Display (B-01, B-02)

> **B-03 and B-04** (deploy workflow version logging and Docker image label) are CI/CD concerns — they are implemented directly in `.github/workflows/deploy.yml` and `Dockerfile`, not in this agent spec. Implement them on the same branch as a chore step after B-01/B-02.

- [ ] **B-01 — Expose version at build time:**
  - In `vite.config.ts`, add a `define` entry: `__APP_VERSION__: JSON.stringify(process.env.npm_package_version)`
  - In `src/vite-env.d.ts`, declare `const __APP_VERSION__: string` so TypeScript resolves it
  - The value is sourced from `package.json` `version` field at build time — never hardcode the string in any source file
  - Set `package.json` `version` to `0.9.1` if not already set

- [ ] **B-02 — Version badge in focus question bar:**
  - In the focus question bar component, render the version string (`v${__APP_VERSION__}`) as a small, always-visible text element
  - Position: bottom-right aligned within the bar (absolute or flex end, bottom)
  - Style: low opacity (`0.35`), small font (`10px`), `COLOR_NODE_TEXT`, `FONT_FAMILY`, `pointer-events: none` so it never intercepts clicks on the input
  - Must not affect the focus question input's layout or behaviour

- [ ] **B-03/B-04 — CI/CD version tagging (chore):**
  - In `.github/workflows/deploy.yml`, add a step before `flyctl deploy` that runs `echo "Deploying ConceptForge v$(node -p "require('./package.json').version")"` with `name: Print app version`
  - In `Dockerfile`, add a build arg `ARG APP_VERSION` and an image label `LABEL org.opencontainers.image.version=$APP_VERSION`; pass `--build-arg APP_VERSION=$(node -p "require('./package.json').version")` in the deploy step (or use `flyctl deploy --build-arg` syntax)

**Commit:** `feat(B-01,B-02): app version from package.json, displayed in focus question bar` + `chore(B-03,B-04): log and tag version in deploy workflow and Dockerfile`

---

### Group 4i — Marquee Selection (C-23 → C-27, V-09, V-10)

- [ ] **C-23 — Select toggle in pane context menu:**
  - In `Canvas.tsx`, add a "Select" item to the `onPaneContextMenu` menu (alongside "Add Node" and "Add Note" from G-01)
  - Maintain a `selectionMode` boolean in canvas state
  - When `selectionMode` is `true`, mark the menu item visually active (e.g. a checkmark prefix or highlighted text using `COLOR_NODE_SELECTED`)
  - Clicking "Select" toggles `selectionMode`; pressing Escape exits selection mode and sets `selectionMode` to `false`
- [ ] **C-24 — Rubber-band drag to select:**
  - When `selectionMode` is active, set React Flow's `selectionOnDrag` prop to `true` and `panOnDrag` to `false`
  - When `selectionMode` is inactive, restore `selectionOnDrag` to `false` and `panOnDrag` to `true`
  - React Flow's built-in selection rectangle behaviour handles the marquee; configure it via props only — no custom SVG rectangle needed
- [ ] **V-09 — Selection rectangle style:**
  - Override React Flow's default selection rectangle CSS with inline or injected styles:
    - Border: `1px solid rgba(249, 115, 22, 0.5)` (orange accent at 50% opacity)
    - Background fill: `rgba(249, 115, 22, 0.05)` (near-transparent orange)
    - No box-shadow
  - Apply via React Flow's `selectionBoxStyle` prop on `<ReactFlow>`
- [ ] **C-25 — Space+drag pans in selection mode:**
  - Set React Flow's `panOnScroll` to `false` and `panOnDrag` to `[1, 2]` (middle and right mouse) when in selection mode, OR use React Flow's `selectionKeyCode` / `panActivationKeyCode` to bind Space as the pan activation key while selection mode is active
  - The simplest correct approach: set `panActivationKeyCode="Space"` on `<ReactFlow>` at all times — Space+drag always pans regardless of mode
- [ ] **C-26 — Drag selected group moves all items:**
  - React Flow handles multi-node drag natively when `multiSelectionActive` — no custom logic needed
  - Verify that dragging any selected node moves all selected nodes together
  - Edges connected to moved nodes update automatically via React Flow's edge routing — confirm no disconnection occurs
- [ ] **C-27 — Delete key removes all selected items:**
  - React Flow's `deleteKeyCode` handles deletion of selected nodes and edges natively
  - Extend the existing `onNodesDelete` / `onEdgesDelete` handlers to also remove selected notes from canvas state
  - Confirm: deleting a selected node also removes its attached edges (React Flow default behaviour)
- [ ] **V-10 — Selected item highlight consistent across single and multi-select:**
  - The `ConceptNode.tsx` selected style (orange border + glow) must apply to every selected node in a multi-selection, not just a single selected node
  - React Flow passes `selected` prop to custom node components — verify `ConceptNode.tsx` already uses this prop and that it works for multi-select (no additional changes expected, but verify)
  - Notes (`NoteNode.tsx`) are non-selectable per G-12 — they are included in rubber-band selection drag (C-26) but do not receive a selection highlight; confirm this is the correct interpretation and implement accordingly

**Commit:** `feat(C-23–C-27,V-09,V-10): marquee selection mode with rubber-band rect, group drag, and delete`

---

### Group 4j — Node Descriptions (C-28, C-29, C-30)

> **Before starting this group:** Extend `ConceptNode` in `src/types/index.ts` with `description?: string` before writing any component code.

- [ ] **C-28 — Edit Info popover:**
  - In `NodeContextMenu.tsx` (or the node right-click handler), add an "Edit Info" menu item alongside "Expand"
  - Selecting "Edit Info" opens a small popover panel positioned near the node
  - The popover contains a single text input pre-filled with the node's current `description` (or empty if none)
  - Clicking outside the popover (blur) saves the current text to the node's `description` field via `setNodes`
  - If the saved text is empty (user deleted the content), set `description` to `undefined` — do not store an empty string
  - Pressing Escape cancels without saving
- [ ] **C-29 — Green dot indicator:**
  - In `ConceptNode.tsx`, render a small green dot (5px diameter, `#22c55e`) positioned inside the node boundary at the top-right corner using `position: absolute`, with a small margin from the border lines (e.g. `top: 4px; right: 4px`) so it does not touch the node edges or obstruct the label
  - The dot is only rendered when `data.description` is a non-empty string
  - The dot must use `pointer-events: auto` so hover events fire on it (see C-30)
  - Add the green dot colour as a token in `theme.ts`: `COLOR_NODE_INFO_DOT = '#22c55e'`
- [ ] **C-30 — Hover tooltip:**
  - When the user's cursor enters the green dot, display a small read-only popover showing the `description` text
  - The popover appears near the dot (e.g. above or to the left) and disappears automatically when the cursor leaves the dot
  - Implement using `onMouseEnter` / `onMouseLeave` on the dot element — no library tooltip component
  - Style: dark background (`COLOR_NODE_BG`), `COLOR_NODE_TEXT` text, small font (`FONT_SIZE_NODE_LABEL`), `border: 1px solid COLOR_NODE_BORDER`, `border-radius: 4px`, padding `6px 10px`, `z-index` above all canvas elements
  - The tooltip must be `pointer-events: none` so it does not interfere with cursor leave detection

**Commit:** `feat(C-28,C-29,C-30): node descriptions — Edit Info popover, green dot indicator, hover tooltip`

---

### Group 4k — Edge Target Reconnection (C-31)

- [ ] **C-31 — Reconnectable target endpoint:**
  - Enable target-end reconnection on `<ReactFlow>` using the `reconnectable` prop (set to `"target"` or equivalent React Flow v12 API) so only the target handle of each edge can be dragged
  - When the user drags the target endpoint away from its current target node:
    - If dropped on a valid node handle: update the edge's `target` (and `targetHandle`) in state via `setEdges`
    - If dropped on empty canvas or a non-handle area: snap back — leave the edge unchanged (React Flow's default `reconnectable` snap-back behaviour handles this; confirm it works)
  - **Branching edge branch arrows:** apply the same `reconnectable="target"` behaviour to the individual hub→target RF edges that make up each branch arrow; when a branch arrow target is changed, update the corresponding entry in the `BranchingEdge.targets` array in state
  - Source end is never draggable — do not enable source reconnection
  - The reconnect interaction must not interfere with edge selection or deletion

**Commit:** `feat(C-31): edge target reconnection with snap-back on empty canvas drop`

---

### Group 4l — Reconnect Disambiguation (C-32, C-33)

- [ ] **C-32 — Hover highlight on reconnect zone:**
  - In `ConceptEdge.tsx` and `BranchArrowEdge.tsx`, detect when the cursor hovers within the reconnect grab radius near the edge's target endpoint
  - While hovered, apply the orange accent colour (`COLOR_EDGE_SELECTED`) to the edge label — the same visual as the selected state
  - Remove the highlight when the cursor leaves the zone
  - Use React Flow's `onReconnectStart` / `onReconnectEnd` callbacks on `<ReactFlow>`, or pointer-event handlers on the edge endpoint area, to drive this hover state

- [ ] **C-33 — Selection gates reconnect draggability:**
  - Only a selected edge's target endpoint is draggable for reconnection; set `reconnectable: false` on all unselected edges at render time (derive from the edge's `selected` prop)
  - When the user clicks an edge path or its label, React Flow selects it (existing behaviour); that selection now also enables its reconnect drag
  - When the user subsequently hovers near any target endpoint, the selected edge's label turns orange (C-32 hover highlight confirms the active edge)
  - Clicking elsewhere on the canvas deselects all edges; all reconnect drags are disabled until a new edge is selected
  - In `ConceptEdge.tsx` and `BranchArrowEdge.tsx`, read the `selected` prop and pass `reconnectable={selected ? 'target' : false}` on the edge or control it via `setEdges` in Canvas state

**Commit:** `feat(C-32,C-33): edge reconnect disambiguation — hover highlight and selection-gated draggability`

---

### Group 4m — Keyboard Navigation (C-34 → C-38)

> **Key remapping note:** C-38 changes existing React Flow default behaviour — plain arrow keys currently nudge selected nodes. This must be explicitly disabled before the new navigation bindings are wired up.

- [ ] **C-38 — Remap nudge to Ctrl+Arrow:**
  - Disable React Flow's built-in arrow-key nudge by setting `disableKeyboardA11y={false}` and overriding via a `keydown` handler, or by using React Flow's `nodesDraggable` / `elementsSelectable` options alongside a custom `onKeyDown` on the canvas wrapper
  - Implement Ctrl+Arrow to move the selected node or edge by the React Flow default nudge step (typically 2px); use `event.ctrlKey` (or `event.metaKey` for Mac parity) to gate this branch
  - Ensure Delete/Backspace for deletion is unaffected

- [ ] **C-34 — Arrow keys navigate node-to-node:**
  - In `Canvas.tsx`, attach a `keydown` listener (or use React Flow's `onKeyDown` prop) that intercepts plain arrow keys when exactly one node is selected
  - For each arrow direction, find all nodes connected to the selected node via any direct edge — both outgoing (selected node is source) and incoming (selected node is target); do not use spatial proximity
  - Among connected neighbours in that direction, select the one with the smallest angular deviation from the arrow's axis (e.g. for Right: `Math.atan2(dy, dx)` closest to 0°); ties broken by shortest distance
  - Call `setNodes` to deselect the current node and select the neighbour
  - If no neighbour exists in that direction, do nothing

- [ ] **C-35 — No/multi selection initial pick:**
  - When no items are selected and any arrow key is pressed (plain or Alt+Arrow), select a random node (`Math.random()` index into the nodes array) and stop — do not navigate on that keypress
  - When multiple items are currently selected and a plain arrow key is pressed, clear the selection via `setNodes` and select a random node (same random-pick behaviour)

- [ ] **C-36 — Edge selected + plain arrow = no-op:**
  - When exactly one edge is selected and a plain arrow key is pressed (no modifier), consume the event (`event.preventDefault()`) and do nothing further

- [ ] **C-37 — Alt+Arrow navigates to edges:**
  - When Alt+Arrow is pressed and a single node is selected, identify all edges connected to that node (both incoming and outgoing); select the edge whose other endpoint (source if incoming, target if outgoing) is most directly in the arrow's direction (smallest angular deviation); deselect the node and select the edge via `setEdges`
  - When Alt+Arrow is pressed and a single edge is selected, treat the edge's source node as the pivot; apply the same directional selection logic across all edges connected to that source node (incoming and outgoing); select the winning edge
  - If no edge exists in that direction, do nothing
  - If nothing is selected, select a random edge and stop (no navigation on that keypress)

**Commit:** `feat(C-34–C-38): keyboard navigation — arrow keys navigate nodes, Alt+Arrow edges, Ctrl+Arrow moves`

---

### Group 4n — Handle and Viewport Fixes (C-39)

- [ ] **C-39 — No viewport zoom on label edit:**
  - In `Canvas.tsx` (or wherever inline edit mode is entered), ensure that entering edit mode on a node does not call `fitView`, `zoomIn`, `zoomTo`, or any React Flow method that changes the viewport
  - If React Flow's double-click handler is triggering a zoom, suppress it: call `event.preventDefault()` or `event.stopPropagation()` on the `onNodeDoubleClick` handler before entering edit mode
  - Verify that the viewport zoom level and position are identical before and after entering and exiting edit mode

**Commit:** `feat(C-39): no viewport zoom on label edit`

---

### Group 4o — Floating Boundary Connection (C-18, C-41, C-42)

> **Before starting this group:** Update `ConceptEdge` in `src/types/index.ts` — the `sourceHandle` and `targetHandle` fields must change from named cardinal string values to a representation that stores a floating boundary position (e.g. `{ side: 'top' | 'right' | 'bottom' | 'left', offset: number }` where `offset` is 0–1 along that side, or an equivalent perimeter fraction). Choose a representation that can be serialised/deserialised in JSON and computed geometrically from node position and dimensions.

- [ ] **C-18 — Floating boundary connection:**
  - Replace the fixed four-handle system in `ConceptNode.tsx` with a floating-point boundary attachment model
  - When the user begins dragging an edge from a node, compute the nearest point on the node's boundary rectangle to the current cursor position and use that as the connection origin; update dynamically as the cursor moves
  - When the user drops an edge onto a target node, attach it at the nearest boundary point to the drop position
  - React Flow approach: use a large number of invisible handles distributed around the boundary perimeter (e.g. one per pixel or a fine grid per side), or use React Flow's `connectionRadius` and a single centre handle with custom SVG edge routing to nearest boundary intersection; choose whichever approach renders correctly and performs well
  - No visible handles at any time

- [ ] **C-41 — Dynamic endpoint repositioning on node move:**
  - When a node is moved (via drag or keyboard nudge), recompute the connection points of all edges attached to that node
  - For each attached edge endpoint, find the nearest boundary point of the moved node that faces the opposite connected node (i.e. the point on the boundary closest to the line between the two node centres)
  - Update edge `sourceHandle` / `targetHandle` data via `setEdges` so the recalculated position is stored in state
  - This applies to: source endpoints on edges leaving the moved node, target endpoints on edges arriving at the moved node, stem edges of branching edges, and branch arrows of branching edges

- [ ] **C-42 — Migration of cardinal handle values on map load:**
  - In `Canvas.tsx` `setMapData()`, after restoring edges from JSON, iterate all edges and check `sourceHandle` / `targetHandle` values
  - If a value is a named cardinal identifier (`"left"`, `"right"`, `"top"`, `"bottom"`, `null`, or `undefined`), recalculate it to the optimal floating boundary position relative to the opposite connected node (using the same geometry as C-41)
  - Store the recalculated value and continue — do not throw or display an error for legacy handle values
  - After migration, all edges must render with correct floating boundary positions regardless of whether the map was saved under the old or new format

**Commit:** `feat(C-18,C-41,C-42): floating boundary edge connections — nearest boundary snap, dynamic repositioning, legacy map migration`

---

### Group 4p — Theme Application (T-02, T-03)

> **Dependency:** The Settings Agent must have implemented T-01 (Theme selector + `useTheme` hook) before this group can begin. Confirm the hook is available in `src/hooks/use-theme.ts` (or equivalent) before starting.

- [ ] **T-02 — Global theme application:**
  - Read the active theme from the hook provided by the Settings Agent (e.g. `useTheme()` returning `'dark' | 'light'`)
  - Apply theme-appropriate colour tokens to every canvas surface: canvas background, dot grid (`<Background>`), `<MiniMap>`, `<Controls>`, `ConceptNode`, `ConceptEdge`, `BranchingEdge`, `NoteNode`, branching edge hub, edge label captions, pane context menu, node context menu, edge context menu, and any other visible UI element owned by the Canvas Agent
  - All colour values for both themes must be defined in `src/lib/theme.ts` — no inline hardcoded hex values; no values outside `theme.ts`
  - The orange accent (`#f97316`) must be preserved and used identically in both themes

- [ ] **T-03 — Light theme variant:**
  - Define a full Light theme palette in `theme.ts` — light canvas background, readable node labels, visible dot grid, and legible edge labels on a light surface; do not reuse dark values
  - The existing Dark theme tokens in `theme.ts` must remain unchanged
  - Both themes must look visually deliberate and consistent with the ConceptForge aesthetic (see CLAUDE.md Section 12 — Visual Design Intentionality)
  - Verify that all CLAUDE.md anti-slop rules are honoured in the light palette: no pastel nodes, no generic white-card look, no random gradients

**Commit:** `feat(T-02,T-03): global theme application and light theme palette on canvas`

---

### Group 4q — High Contrast Node Rendering (V-13)

> **Dependency:** The Settings Agent must have implemented K-15 (high contrast nodes toggle + hook) before this group can begin. Confirm the hook is available before starting.

- [ ] **V-13 — High contrast concept node style:**
  - Add per-theme named constants to `src/lib/theme.ts` for both dark and light themes (exact values at implementer's discretion — must improve contrast against each theme's canvas background):
    ```ts
    // Dark theme
    export const COLOR_NODE_BORDER_HIGH_CONTRAST = '#6b7280'
    export const NODE_HIGH_CONTRAST_SHADOW = '0 2px 8px rgba(0,0,0,0.6)'
    // Light theme
    export const COLOR_NODE_BORDER_HIGH_CONTRAST_LIGHT = '<appropriate darker value>'
    export const NODE_HIGH_CONTRAST_SHADOW_LIGHT = '<appropriate shadow for light bg>'
    ```
  - In `ConceptNode.tsx`, read the high contrast setting from the hook provided by the Settings Agent (e.g. `highContrastNodes` from `useTheme()`)
  - When high contrast is enabled, apply to the node's default (unselected) style for the active theme:
    - Border colour: theme-appropriate high contrast border constant (replaces `COLOR_NODE_BORDER`)
    - Box shadow: theme-appropriate high contrast shadow constant
  - When high contrast is disabled, render with the standard `COLOR_NODE_BORDER` and no additional shadow
  - The selected-state style (orange border + `COLOR_NODE_GLOW` glow) must remain fully unchanged regardless of this setting
  - `NoteNode.tsx` and `BranchHubNode.tsx` must not receive any style changes from this setting

**Commit:** `feat(V-13): high contrast node rendering — brighter border and drop shadow in both themes when enabled`

---

### Group 5 — UI Verification (Playwright MCP)

Before committing Group 4, run the web design audit and the Playwright visual check:

**Step A — Web Design Audit:**
Run `/web-design-guidelines` against the canvas components:
```
/web-design-guidelines src/components/canvas/Canvas.tsx src/components/canvas/ConceptNode.tsx src/lib/theme.ts
```
Fix all reported violations before proceeding to Step B. Common things it will check:
- Keyboard operability of interactive elements (node handles, delete key, edit mode)
- Focus indicators on all interactive elements
- Sufficient colour contrast on node labels (`#e6edf3` text on `#161b22` background)
- Animation respects `prefers-reduced-motion`
- No missing ARIA labels on icon-only buttons

**Step B — Playwright MCP visual check:**

Start the dev server and use Playwright MCP + Chrome to verify:

- [ ] Canvas renders with dark background on load
- [ ] Double-click on canvas background creates a new node
- [ ] Double-click on a node enters edit mode; Enter confirms the label change
- [ ] Pressing Backspace with a node selected deletes the node
- [ ] Dragging from one node handle to another creates a directional edge
- [ ] Minimap is visible and reflects canvas contents
- [ ] Zoom and pan work via mouse wheel and drag
- [ ] Hovering a node visibly changes its border colour (transition, not instant)
- [ ] Selecting a node shows the orange border + glow — distinct from hover
- [ ] Node labels render in the monospace font (not a system sans-serif)
- [ ] Background dots are clearly visible against the canvas background
- [ ] No purple, blue, or gradient colours appear anywhere on screen
- [ ] No errors in browser console

Log any visual or interaction issues found as `/feedback` entries before committing.

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| Canvas, custom nodes, edge drawing, visual styling | Claude API calls — that is the AI Agent |
| `ConceptNode` and `ConceptEdge` state management | JSON save/load, PNG export — that is the Persistence Agent |
| Dark and Light theme tokens in `src/lib/theme.ts`; applying active theme to canvas surfaces (T-02, T-03) | Theme selector UI, localStorage persistence, OS default detection (T-01) — that is the Settings Agent |

Do not implement anything outside the Canvas and Visual Design requirement IDs.

---

## Output Checklist

When done, the following must exist:

```
src/
├── components/
│   └── canvas/
│       ├── Canvas.tsx            ✓ React Flow wrapper, full CRUD, pane context menu
│       ├── ConceptNode.tsx       ✓ custom node with inline edit
│       ├── ConceptEdge.tsx       ✓ custom edge with always-visible label and inline edit
│       ├── BranchingEdge.tsx     ✓ fan-out edge with draggable hub, branch arrows, partial delete
│       └── NoteNode.tsx          ✓ resizable note/group with colour palette and text edit
├── lib/
│   └── theme.ts                  ✓ colour token constants + note palette
```

`App.tsx` mounts `<Canvas />` and the app renders a working dark canvas.

---

## Handoff

When this branch is merged to main, the following agents are unblocked (alongside Settings Agent if not yet complete):

- **AI Agent** → reads `agentspecs/03-ai-agent.md` — requires Canvas and Settings both merged
- **Persistence Agent** → reads `agentspecs/04-persistence-agent.md` — requires Canvas merged

Run `/feedback` for any issues encountered. Run `/improve` if 3+ feedback entries are open.

---

*Canvas Agent Spec v1.17 — March 2026 (added Group 4l: C-32→C-33 — reconnect disambiguation: hover highlight and selection-gated draggability)*

*Canvas Agent Spec v1.18 — April 2026 (added Group 4p: T-02/T-03 — global theme application and light theme palette; updated Trigger line and Scope Boundaries)*

*Canvas Agent Spec v1.19 — April 2026 (added Group 4q: V-13 — high contrast node rendering: brighter border and drop shadow when K-15 enabled in dark theme; theme.ts constants; notes and hub nodes unaffected; updated Trigger line to V-01 → V-13)*

*Canvas Agent Spec v1.20 — April 2026 (updated Group 4q: V-13 now applies to both dark and light themes; per-theme constants required in theme.ts; removed dark-theme-only condition from ConceptNode.tsx logic)*
