# Agent Spec: Canvas Agent

**Agent:** Canvas Agent
**Sequence:** 01 — runs after Scaffolder completes
**Trigger:** Human assigns requirement IDs C-01 → C-07 and V-01 → V-04
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

---

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

### Group 5 — UI Verification (Playwright MCP)

Before committing Group 4, start the dev server and use Playwright MCP + Chrome to verify:

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
| Dark theme tokens in `src/lib/theme.ts` | Settings panel, API key handling — that is the Settings Agent |

Do not implement anything outside the Canvas and Visual Design requirement IDs.

---

## Output Checklist

When done, the following must exist:

```
src/
├── components/
│   └── canvas/
│       ├── Canvas.tsx          ✓ React Flow wrapper, full CRUD
│       └── ConceptNode.tsx     ✓ custom node with inline edit
├── lib/
│   └── theme.ts                ✓ colour token constants
```

`App.tsx` mounts `<Canvas />` and the app renders a working dark canvas.

---

## Handoff

When this branch is merged to main, the following agents are unblocked (alongside Settings Agent if not yet complete):

- **AI Agent** → reads `agentspecs/03-ai-agent.md` — requires Canvas and Settings both merged
- **Persistence Agent** → reads `agentspecs/04-persistence-agent.md` — requires Canvas merged

Run `/feedback` for any issues encountered. Run `/improve` if 3+ feedback entries are open.

---

*Canvas Agent Spec v1.1 — Added Visual Design Intentionality: theme.ts token system, micro-interactions, canvas atmosphere, anti-slop checklist — March 2026*
