# Agent Spec: AI Agent

**Agent:** AI Agent
**Sequence:** 03 — runs after Canvas Agent and Settings Agent both complete
**Trigger:** Human assigns requirement IDs A-01 → A-09
**Branch:** `feature/A-01-map-generation`
**Depends on:** Canvas Agent (01) and Settings Agent (02) both merged to main
**Parallel with:** Persistence Agent (04)
**Blocks:** QA Agent (05)

---

## Mission

Wire ConceptForge to the Claude API. When this agent is done, users must be able to describe a topic and receive a fully rendered concept map on the canvas, and expand any node to generate related child concepts. All AI output must be validated against the `ClaudeMapResponse` type before touching the canvas. The API key from the Settings Agent's `useApiKey` hook must be the only authentication mechanism.

---

## Input Documents

Read these in full before taking any action:

| Document | Path | Why |
|---|---|---|
| Requirements | `requirements/requirements.md` | Sections 4.2 (Map Generation) and 4.3 (Node Expansion); Section 8 (AI Output Contract) |
| Agent instructions | `CLAUDE.md` | API Key Safety rules, error handling rules, UI Verification gate |
| Shared types | `src/types/index.ts` | `ConceptNode`, `ConceptEdge`, `ClaudeMapResponse`, `ExpandNodeRequest` |
| Canvas Agent output | `src/components/canvas/Canvas.tsx` | Understand how nodes/edges are passed in so you can add to them |
| Settings Agent output | `src/hooks/useApiKey.ts` | Use this hook — do not re-implement key retrieval |
| Dev method | `devmethod/devmethod.md` | Workflow steps including Playwright MCP gate |
| This spec | `agentspecs/03-ai-agent.md` | Your task list |

---

## Deliverables

Complete all items below in order. Commit after each group.

---

### Group 1 — Claude API Client (lib/claude.ts)

Populate the stub at `src/lib/claude.ts`. This file is the single interface to the Claude API — no other file makes direct `fetch` calls to Anthropic.

- [ ] Implement `generateMap(prompt: string, apiKey: string): Promise<ClaudeMapResponse>`:
  - POST to `https://api.anthropic.com/v1/messages`
  - Model: `claude-3-5-haiku-20241022` (fast, cost-effective for structured output)
  - System prompt: instructs Claude to return only a JSON object matching the `ClaudeMapResponse` schema — no prose, no markdown fences
  - User message: the user's topic prompt
  - Parse and validate the response against `ClaudeMapResponse` before returning
  - Throw a typed error if the response cannot be parsed or does not conform

- [ ] Implement `expandNode(request: ExpandNodeRequest, apiKey: string): Promise<ClaudeMapResponse>`:
  - Same API endpoint and model
  - System prompt: instructs Claude to generate related child concepts for the given node, avoiding nodes already present in `existingNodes`
  - Returns new nodes and edges to append — does not return the full map

- [ ] Validation helper `parseClaudeResponse(raw: unknown): ClaudeMapResponse`:
  - Validates that `raw` has a `nodes` array and an `edges` array
  - Each node has `id` (string) and `label` (string)
  - Each edge has `source` (string) and `target` (string)
  - Throws `Error('Invalid AI response shape')` if validation fails

- [ ] No API key is ever logged — pass it only to the `Authorization` header as `Bearer <key>`

**Commit:** `feat(A-02): Claude API client with generateMap, expandNode, and response validation`

---

### Group 2 — Prompt Input and Map Generation (A-01 → A-05)

- [ ] Create `src/components/ai/PromptPanel.tsx`:
  - Textarea for the user's topic description (A-01)
  - "Generate Map" submit button (A-02)
  - Button is disabled while the AI call is in progress (async guard)
  - Shows an inline loading indicator on the button during the call (A-04)
  - On success: passes the validated `ClaudeMapResponse` to the canvas (A-03)
  - On error: displays a user-visible error message below the textarea (A-05)
    - Error must describe what went wrong (API error, network error, invalid response)
    - No `console.error` as a substitute for displayed error state
  - Clears error on next submission attempt

- [ ] Layout: position the PromptPanel as a sidebar or bottom panel — does not overlap the canvas

- [ ] Canvas integration:
  - On successful map generation, call a prop or context method to replace canvas nodes and edges with the AI-generated map
  - Position nodes using a basic auto-layout from `src/lib/graph.ts` (implement a simple grid or radial layout if not already present)

- [ ] Before submitting: check `useApiKey().hasKey` — if no key, call `openSettings()` instead (K-03 guard from Settings Agent)

**Commit:** `feat(A-01,A-03,A-04,A-05): prompt panel, map generation, loading and error states`

---

### Group 3 — Node Expansion (A-06 → A-09)

- [ ] Add right-click context menu to canvas nodes (A-06):
  - Create `src/components/canvas/NodeContextMenu.tsx`
  - Right-click a node → show menu with "Expand" option
  - Menu closes on Escape or click outside
  - While expansion is in progress, "Expand" shows a loading state and is not re-clickable

- [ ] On "Expand" (A-07):
  - Build an `ExpandNodeRequest` from the clicked node and the current node list
  - Call `expandNode()` from `src/lib/claude.ts`
  - On success: append new nodes and edges to the canvas (A-08)
  - On error: show an error message in the context menu area

- [ ] Duplicate prevention (A-09):
  - Before appending new nodes, filter out any node whose `label` already exists in the current node list (case-insensitive comparison)
  - Log filtered duplicates to the expansion result — do not silently discard without indication

- [ ] Auto-position new nodes around the expanded parent node — use `src/lib/graph.ts`

**Commit:** `feat(A-06,A-07,A-08,A-09): right-click node expansion with duplicate prevention`

---

### Group 4 — UI Verification (Playwright MCP)

Before committing Group 3, start the dev server and use Playwright MCP + Chrome to verify:

- [ ] Prompt panel is visible and accessible
- [ ] Submitting a prompt with a valid API key stored → loading state appears, then nodes render on canvas
- [ ] Submitting without an API key → Settings panel opens (not an error crash)
- [ ] Submitting with an invalid API key → error message appears in the UI, not just console
- [ ] Right-clicking a node → context menu with "Expand" appears
- [ ] Clicking "Expand" → new child nodes appear connected to the expanded node
- [ ] Re-expanding the same node → no duplicate nodes added
- [ ] No errors in browser console during normal operation

Log any issues as `/feedback` entries before committing.

---

## AI Output Contract

The Claude API must return JSON in this exact shape. The agent must enforce this:

```typescript
// ClaudeMapResponse (from src/types/index.ts)
{
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ source: string; target: string; label?: string }>
}
```

The system prompt sent to Claude must specify this schema explicitly and instruct Claude to return only the JSON object — no markdown, no explanation, no code fences. If the model returns anything that does not parse to this shape, surface an error to the user.

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| `src/lib/claude.ts` — all Claude API calls | Canvas CRUD (add/edit/delete nodes) — already done by Canvas Agent |
| `src/components/ai/PromptPanel.tsx` | API key storage — already done by Settings Agent |
| `src/components/canvas/NodeContextMenu.tsx` | JSON save/load, PNG export — that is the Persistence Agent |
| `src/lib/graph.ts` layout helpers (auto-position only) | Suggest connections (N-01) — post-MVP |

---

## Output Checklist

When done, the following must exist:

```
src/
├── components/
│   ├── ai/
│   │   └── PromptPanel.tsx         ✓ prompt input, loading, error states
│   └── canvas/
│       └── NodeContextMenu.tsx     ✓ right-click expand menu
├── lib/
│   ├── claude.ts                   ✓ generateMap, expandNode, parseClaudeResponse
│   └── graph.ts                    ✓ auto-layout helpers for node positioning
```

---

## Handoff

When this branch is merged to main, the QA Agent is closer to being fully unblocked:

- **QA Agent** → reads `agentspecs/05-qa-agent.md` — requires all feature agents merged

Run `/feedback` for any issues encountered. Run `/improve` if 3+ feedback entries are open.

---

*AI Agent Spec v1.0 — March 2026*
