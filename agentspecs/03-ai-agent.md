# Agent Spec: AI Agent

**Agent:** AI Agent
**Sequence:** 03 — runs after Canvas Agent and Settings Agent both complete
**Trigger:** Human assigns requirement IDs A-01 → A-33
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

> **Requirements gate — mandatory before writing any code:**
> If the human's request involves a **new requirement** or a **change to an existing requirement**, stop immediately and invoke the Requirements Agent (`/requirements`) before writing any implementation code. The Requirements Agent runs the Q&A, gets human approval, and commits on a `chore/requirements-*` branch. Only after that branch is merged to `main` does this agent proceed. Requirements documents (`requirements/requirements.md` and `requirements/requirements.html`) must never be updated as a side-effect of an implementation task — they are owned exclusively by the Requirements Agent.

> **Git protocol — mandatory before every commit and before raising a PR:**
> 1. **Branch check:** run `git branch --show-current` — output must NOT be `main`. If it is, stop. Switch to `feature/A-01-map-generation` and re-stage changes before committing.
> 2. **Main alignment:** run `git fetch origin main && git merge origin/main --no-edit` before pushing and raising a PR. Resolve any conflicts, then re-run `pnpm lint && pnpm typecheck && pnpm test`. The branch must be zero commits behind `origin/main`.
> 3. **PR merge:** after opening the PR with `gh pr create`, stop. Never run `gh pr merge` or any equivalent. The human reviews and merges the PR.

> **Skills active for this agent:** When writing React component code, consult `vercel-react-best-practices` (apply rules from CLAUDE.md Section 11 caveat — skip `server-*` and hydration rules). For `lib/claude.ts`, pay particular attention to `async-parallel` and `async-defer-await` rules. For `PromptPanel.tsx` and `NodeContextMenu.tsx`, apply all `rerender-*` rules and run `/web-design-guidelines src/components/ai/PromptPanel.tsx src/components/canvas/NodeContextMenu.tsx` before committing Group 3 — the prompt form and context menu must pass keyboard operability and form behaviour checks.

---

### Group 0 — Focus Question Bar (F-01 → F-04)

- [ ] Create `src/components/ai/FocusQuestionBar.tsx`:
  - Persistent bar rendered at the top of the app, above the canvas (mounted in `src/App.tsx`)
  - Single-line editable input — click to edit, blur or Enter to confirm (F-03)
  - When empty shows placeholder: `"Enter your focus question or statement…"` (F-02)
  - Styled prominently: larger font size, accent colour (`COLOR_NODE_SELECTED`) for the text, distinct background using `COLOR_PANEL_BG`, full-width (F-04)
  - Stores value in local React state and exposes it via a prop callback `onFocusQuestionChange`
- [ ] Mount `<FocusQuestionBar>` in `src/App.tsx`, passing focus question state down
- [ ] The focus question string must be accessible to the PromptPanel (Group 2) and NodeContextMenu (Group 3)

**Commit:** `feat(F-01,F-02,F-03,F-04): focus question bar — persistent, editable, prominently styled`

---

### Group 1 — Claude API Client (lib/claude.ts)

Populate the stub at `src/lib/claude.ts`. This file is the single interface to the Claude API — no other file makes direct `fetch` calls to Anthropic.

- [ ] Implement `generateMap(prompt: string, apiKey: string): Promise<ClaudeMapResponse>`:
  - POST to `https://api.anthropic.com/v1/messages`
  - Model: `claude-haiku-4-5-20251001` (fast, cost-effective for structured output)
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
- [ ] When a focus question is present, prepend it to the AI prompt as context (F-07):
  - If focus question is set: `"Focus question: <question>\n\nTopic: <user prompt>"`
  - If not set: send the user prompt as-is (no change to existing behaviour)

**Commit:** `feat(A-01,A-03,A-04,A-05,F-07): prompt panel, map generation, loading and error states, focus question context`

---

### Group 3 — Node Expansion (A-06 → A-09)

- [ ] Add right-click context menu to canvas nodes (A-06):
  - Create `src/components/canvas/NodeContextMenu.tsx`
  - Right-click a node → show menu with "Expand" option
  - Menu closes on Escape or click outside
  - While expansion is in progress, "Expand" shows a loading state and is not re-clickable

- [ ] On "Expand" (A-07):
  - Build an `ExpandNodeRequest` from the clicked node and the current node list
  - When a focus question is present, include it in the expansion prompt as context (F-07)
  - Call `expandNode()` from `src/lib/claude.ts`
  - On success: append new nodes and edges to the canvas (A-08)
  - On error: show an error message in the context menu area

- [ ] Duplicate prevention (A-09):
  - Before appending new nodes, filter out any node whose `label` already exists in the current node list (case-insensitive comparison)
  - Log filtered duplicates to the expansion result — do not silently discard without indication

- [ ] Auto-position new nodes around the expanded parent node — use `src/lib/graph.ts`

- [ ] **A-10 — Node description as expansion context:**
  - When building the `ExpandNodeRequest` for a node that has a non-empty `description`, include the description in the prompt alongside the node label
  - Prompt format: `"Node: <label>\nDescription: <description>"` (vs `"Node: <label>"` when no description is set)
  - If the node has no description, the prompt is unchanged (no regression to existing behaviour)

**Commit:** `feat(A-06,A-07,A-08,A-09,A-10): right-click node expansion with duplicate prevention and description context`

---

### Group 4 — AI Summary Panel (A-16 → A-22)

Extend the Mode 1 and Mode 2 API calls to request a narrative and resource links in the same response, then render the summary panel.

- [ ] **Extend `generateMap` (Mode 1) and `suggestConcepts` (Mode 2) prompts** to instruct Claude to include a `narrative` string and a `resources` array (up to 5 items, each `{ label, url }`) in the JSON response alongside the existing fields

- [ ] **Extend `parseClaudeResponse` / `parseConceptSuggestions`** in `src/lib/claude.ts` to extract and validate `narrative` (string) and `resources` (array of `{ label: string; url: string }`) — both required; throw if absent or malformed

- [ ] **Create `src/components/ai/SummaryPanel.tsx`** (A-16, A-17, A-22):
  - Semi-transparent panel overlaying the right edge of the canvas
  - Vertically spans from just below the menu button to the viewport bottom
  - Appears only after generation completes and content is on canvas — not during loading
  - All colours from `theme.ts`; panel width at agent's discretion

- [ ] **Typewriter animation** (A-19):
  - Reveal the narrative text character by character at a natural human typing pace
  - Resource links are hidden during animation; they appear below the narrative once animation completes

- [ ] **Dismiss button** (A-20):
  - Appears only once the typewriter animation completes
  - Clicking it removes the panel; panel does not reappear until the next generation

- [ ] **Scrollable content** (A-21):
  - If narrative + links exceed the panel height, the content area scrolls independently

- [ ] **Resource links** (A-18, A-22):
  - Render each resource as a hyperlink using Claude's provided label and URL
  - Open in a new tab with `rel="noopener noreferrer"`

- [ ] **Wire into App.tsx**:
  - Pass `narrative` and `resources` from the API response up to the parent
  - Control panel visibility — show after map/nodes land, hide on dismiss

**Commit:** `feat(A-16,A-17,A-18,A-19,A-20,A-21,A-22): AI summary panel with typewriter animation and resource links`

---

### Group 5 — Node Descriptions, Layout, and Fit-to-View (A-23 → A-25)

- [ ] **A-23 — Mode 1 node descriptions:**
  - Extend the `generateMap` prompt to instruct Claude to include a `description` field on every node in the response
  - Update the `ClaudeMapResponse` type and `parseClaudeResponse` to extract `description?: string` from each node
  - Map `description` onto the `ConceptNode.description` field before passing to the canvas so the node description tooltip (C-29) is pre-populated for every AI-generated node
  - Mode 2 (`suggestConcepts`) already returns per-concept descriptions — no change required for that path

- [ ] **A-24 — Non-overlapping layout after all AI actions:**
  - Upgrade `autoLayout` in `src/lib/graph.ts` (or add a new layout helper) to guarantee that no two node bounding boxes overlap after positioning
  - Apply this layout after Mode 1 map generation and after Mode 2 concept suggestion — both must produce a tidy, non-overlapping result
  - Node labels must not overlap adjacent node bodies; treat each node as at minimum a 160 × 50 px bounding box when computing clearance
  - Use a Dagre, ELK, or force-directed approach — whichever produces readable output; document the choice in a brief code comment

- [ ] **A-25 — Automatic fit-to-view after all AI actions:**
  - After Mode 1 map generation completes and canvas nodes are set, call `reactFlowInstance.fitView({ padding: 0.15, duration: 400 })` so the full map is immediately visible
  - After Mode 2 concept suggestion appends new nodes, call the same `fitView` so newly placed nodes are not off-screen
  - The duration must use a named constant from `theme.ts` (e.g. `FIT_VIEW_DURATION_MS = 400`)

**Commit:** `feat(A-23,A-24,A-25): node descriptions in Mode 1, non-overlapping layout, auto fit-to-view`

---

### Group 6 — AI Node Chat (A-26 → A-30)

- [ ] Add "Chat" button to the concept node right-click context menu (A-26)
  - Always visible; dimmed (`opacity: 0.35`, `pointerEvents: 'none'`) when AI Assist is off — same pattern as Expand (K-08)
- [ ] Wire "Chat" to open a Chat panel in `App.tsx` (A-27)
  - If Summary Panel is visible, dismiss it before showing Chat panel
  - Both panels share a single slot — never shown simultaneously
- [ ] Create `src/components/ai/ChatPanel.tsx` (A-28)
  - Styled and positioned identically to `SummaryPanel.tsx` (same width, position, background, border, z-index)
  - Header shows the node label as the chat heading (e.g. "Chat — Photosynthesis")
  - Dismiss button closes the panel
- [ ] Implement chat interaction (A-29)
  - Scrollable message history area (user messages right-aligned, AI responses left-aligned)
  - Text input pinned to the bottom of the panel; submit on Enter or send button
  - On submit: call Claude API with a conversational prompt including node label, node description (if present), and focus question as system context
  - Show a loading indicator while awaiting AI response
  - AI response appended to history on completion; error shown inline on failure
- [ ] Implement history lifecycle (A-30)
  - History persists while the panel is open
  - History is cleared when: (a) panel is dismissed, (b) Chat is opened for a different node

**Commit:** `feat(A-26,A-27,A-28,A-29,A-30): AI Node Chat panel`

---

### Group 6b — Chat Reading View (A-31 → A-32)

- [ ] **A-31 — Reading view button on each AI response:**
  - Add a persistent icon button to every AI response message bubble in `ChatPanel.tsx`
  - Button is always visible (not just on hover)
  - Clicking the button opens the reading panel for that specific message only

- [ ] **A-32 — Reading panel:**
  - Create `src/components/ai/ChatReadingPanel.tsx`
  - Centred overlay in the viewport at 70% of viewport width × 70% of viewport height
  - Renders the AI message content as markdown (bold, headings, bullet lists, code blocks) — use a markdown rendering library or a lightweight custom renderer consistent with existing dependencies
  - Contains an explicit dismiss ("×") button in the top-right corner
  - Also dismisses when the user clicks outside the panel boundary
  - Only one reading panel may be open at a time; opening a second closes the first

**Commit:** `feat(A-31,A-32): reading view button on chat AI responses, centred markdown reading panel`

---

### Group 6c — Concept Chat System Prompt (A-33)

- [ ] In `src/lib/claude.ts`, update the `chatNode` function to accept an optional `systemPrompt` string parameter
- [ ] When `systemPrompt` is provided, include it as the `system` field in the Messages API request body — sent once per call, not injected into the `messages` array
- [ ] In `src/components/ai/ChatPanel.tsx`, import `getConceptChatPrompt` from `src/lib/chatPrompts.ts` and pass the result to every `chatNode` call
- [ ] The system prompt applies only to concept node chats — do not pass it to `generateMap`, `expandNode`, or any other API call

**Commit:** `feat(A-33): system prompt on concept node chat calls`

---

### Group 7 — UI Verification (Playwright MCP)

Before committing Group 6, start the dev server and use Playwright MCP + Chrome to verify:

- [ ] Prompt panel is visible and accessible
- [ ] Submitting a prompt with a valid API key stored → loading state appears, then nodes render on canvas
- [ ] Submitting without an API key → Settings panel opens (not an error crash)
- [ ] Submitting with an invalid API key → error message appears in the UI, not just console
- [ ] Right-clicking a node → context menu with "Expand" appears
- [ ] Clicking "Expand" → new child nodes appear connected to the expanded node
- [ ] Re-expanding the same node → no duplicate nodes added
- [ ] No errors in browser console during normal operation
- [ ] Right-clicking a node → "Chat" item visible in context menu
- [ ] "Chat" dimmed and non-interactive when AI Assist is off
- [ ] Clicking "Chat" → Chat panel opens with correct node label heading
- [ ] If Summary Panel is open when "Chat" is clicked → Summary Panel dismissed, Chat Panel appears
- [ ] Typing a message and submitting → loading indicator shown, AI response appended to history
- [ ] Dismissing Chat panel → history cleared; reopening shows empty chat
- [ ] Opening Chat on a different node → history cleared, new heading shown
- [ ] Every AI response has a reading view icon button (always visible, not hover-only)
- [ ] Clicking reading view icon → reading panel opens with only that message's content
- [ ] Reading panel renders markdown correctly (bold, bullet lists, headings visible)
- [ ] Clicking outside the reading panel → panel dismisses
- [ ] Clicking the dismiss button → panel dismisses
- [ ] Opening a reading panel while another is open → first panel closes
- [ ] Chat responses reference citations and include a Resources section with links
- [ ] Editing the system prompt in Settings → subsequent chat responses reflect the new prompt
- [ ] Resetting to default in Settings → chat responses reflect the default prompt behaviour

Log any issues as `/feedback` entries before committing.

---

## AI Output Contract

All Claude API responses must include `narrative` (string) and `resources` (array of `{ label: string; url: string }`, max 5) in addition to their primary payload. The agent must enforce this in validation.

**Mode 1 — Generate Map:**
```json
{
  "nodes": [{ "id": "1", "label": "Main Concept", "description": "A brief definition of the concept." }],
  "edges": [{ "source": "1", "target": "2", "label": "relates to" }],
  "narrative": "Explanation of the topic and why these concepts were chosen.",
  "resources": [{ "label": "Wikipedia — Topic", "url": "https://en.wikipedia.org/wiki/Topic" }]
}
```

**Mode 2 — Suggest Concepts:**
```json
{
  "concepts": [{ "id": "1", "label": "Concept", "description": "Brief description." }],
  "narrative": "Explanation of the topic and why these concepts were suggested.",
  "resources": [{ "label": "Wikipedia — Topic", "url": "https://en.wikipedia.org/wiki/Topic" }]
}
```

The system prompt must specify these schemas explicitly and instruct Claude to return only the JSON object — no markdown, no explanation, no code fences. If the model returns anything that does not parse to this shape, surface an error to the user.

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| `src/lib/claude.ts` — all Claude API calls | Canvas CRUD (add/edit/delete nodes) — already done by Canvas Agent |
| `src/components/ai/PromptPanel.tsx` | API key storage — already done by Settings Agent |
| `src/components/ai/FocusQuestionBar.tsx` — F-01 → F-04 | JSON save/load, PNG export — that is the Persistence Agent |
| `src/components/canvas/NodeContextMenu.tsx` | Focus question persistence (F-05, F-06) — that is the Persistence Agent |
| `src/lib/graph.ts` layout helpers (auto-position only) | Suggest connections (N-01) — post-MVP |

---

## Output Checklist

When done, the following must exist:

```
src/
├── components/
│   ├── ai/
│   │   ├── FocusQuestionBar.tsx    ✓ persistent bar, editable, mode buttons, loading/error
│   │   └── SummaryPanel.tsx        ✓ typewriter narrative, resource links, dismiss, scroll
│   └── canvas/
│       └── NodeContextMenu.tsx     ✓ right-click expand menu, F-07 context
├── lib/
│   ├── claude.ts                   ✓ generateMap, suggestConcepts, expandNode, parseClaudeResponse
│   └── graph.ts                    ✓ auto-layout helpers, ringPositions
```

---

## Handoff

When this branch is merged to main, the QA Agent is closer to being fully unblocked:

- **QA Agent** → reads `agentspecs/05-qa-agent.md` — requires all feature agents merged

Run `/feedback` for any issues encountered. Run `/improve` if 3+ feedback entries are open.

---

*AI Agent Spec v1.8 — March 2026 (added A-33: concept chat system prompt sent via `system` parameter — Group 6c; chatNode updated to accept systemPrompt; ChatPanel reads from chatPrompts.ts)*
