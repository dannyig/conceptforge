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

- [ ] Dark theme throughout (V-01):
  - Canvas background: `#0d1117`
  - Node background: `#161b22`, border: `#30363d`
  - Node text: `#e6edf3`
  - Edge stroke: `#4b5563`
  - Selected node border: `#f97316`
- [ ] Create `src/lib/theme.ts` — exports all colour tokens as named constants
  - All components must import colours from this file, not hardcode them
- [ ] Node labels legible at default zoom (V-02) — minimum font size 13px, no overflow clipping
- [ ] Responsive layout — canvas fills the viewport, usable at 1280px+ (V-04)
- [ ] Verify no inline `style` values are hardcoded — all colours from `theme.ts`

**Commit:** `feat(V-01,V-02,V-04): dark theme, node styles, responsive layout`

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

*Canvas Agent Spec v1.0 — March 2026*
