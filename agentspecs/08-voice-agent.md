# Agent Spec: Voice Agent

**Agent:** Voice Agent
**Sequence:** 08 — runs after AI Agent (03) completes
**Trigger:** Human assigns requirement IDs VC-01 → VC-08
**Branch:** `feature/VC-01-voice-chat`
**Depends on:** AI Agent (03) merged to main (Chat panel A-26–A-33 must exist); Settings Agent (02) merged to main (K-16 ElevenLabs key must be readable)
**Parallel with:** Nothing — depends on Chat panel being stable
**Blocks:** QA Agent (05) for voice coverage

---

## Mission

Rebuild the concept node Chat panel as a unified text + voice panel. When this agent is done: the Chat panel is centred at 70% viewport, AI responses accumulate in a scrollable markdown area, a text input + mic button sit in the bottom bar, and clicking the mic button toggles voice mode (SpeechRecognition + TTS) on and off. Text mode is silent; voice mode reads responses aloud via ElevenLabs or browser `speechSynthesis`. There is no separate Voice Chat panel — voice mode is a toggle within the single Chat panel. No new backend, no new external dependencies beyond an optional ElevenLabs API call.

---

## Input Documents

Read these in full before taking any action:

| Document | Path | Why |
|---|---|---|
| Requirements | `requirements/requirements.md` | Section 4.16 (Voice Chat): VC-01–VC-08 and K-16 |
| Agent instructions | `CLAUDE.md` | UI Verification gate, no-backend constraint, security rules |
| Shared types | `src/types/index.ts` | Type contracts — do not alter |
| AI Agent output | `src/components/ai/ChatPanel.tsx` | Chat panel to add voice icon to |
| Settings Agent output | `src/lib/elevenlabsConfig.ts` | Read ElevenLabs key; do not re-implement |
| AI Agent output | `src/lib/claude.ts` | Extend with voice chat API call |
| Dev method | `devmethod/devmethod.md` | Workflow steps including Playwright MCP gate |
| This spec | `agentspecs/08-voice-agent.md` | Your task list |

---

## Deliverables

Complete all items below in order. Commit after each group.

> **Requirements gate — mandatory before writing any code:**
> If the human's request involves a **new requirement** or a **change to an existing requirement**, stop immediately and invoke the Requirements Agent (`/requirements`) before writing any implementation code.

> **Git protocol — mandatory before every commit and before raising a PR:**
> 1. **Branch check:** run `git branch --show-current` — output must NOT be `main`.
> 2. **Main alignment:** run `git fetch origin main && git merge origin/main --no-edit` before pushing and raising a PR.
> 3. **PR merge:** after opening the PR with `gh pr create`, stop. Never run `gh pr merge`.

> **Skills active for this agent:** When writing React component code, consult `vercel-react-best-practices`. After completing Group 3, run `/web-design-guidelines src/components/ai/VoiceChatPanel.tsx` before committing.

---

### Group 1 — Voice Chat Claude API call (VC-04)

The voice chat Claude response requires a structured two-field format distinct from all other Claude calls.

- [ ] Add a `voiceChat` function to `src/lib/claude.ts`:
  ```typescript
  interface VoiceChatMessage {
    role: 'user' | 'assistant'
    content: string   // speech text only — visual content excluded from history
  }

  interface VoiceChatResponse {
    speech: string           // text to be read aloud — always present
    visual?: string          // optional markdown for panel display — absent when not needed
  }

  export async function voiceChat(
    userMessage: string,
    nodeLabel: string,
    nodeDescription: string | undefined,
    focusQuestion: string | undefined,
    history: VoiceChatMessage[],
    apiKey: string,
  ): Promise<VoiceChatResponse>
  ```
- [ ] The Claude API call must:
  - Use the K-09 system prompt (from `getConceptChatPrompt()` in `chatPrompts.ts`) as the `system` parameter
  - Include `history` as the `messages` array (prior turns) followed by the new user message
  - Request a JSON response with `speech` (required) and `visual` (optional markdown) fields
  - Apply the model from `getModel()` (K-14)
  - Validate that the response contains a non-empty `speech` field before returning
- [ ] Add `VoiceChatMessage` and `VoiceChatResponse` to `src/types/index.ts`

**Commit:** `feat(VC-04): voiceChat API call in claude.ts with speech+visual structured response`

---

### Group 2 — TTS service abstraction (VC-05)

- [ ] Create `src/lib/tts.ts`:
  ```typescript
  export async function speak(text: string): Promise<void>
  export function stopSpeaking(): void
  export function isSpeaking(): boolean
  ```
  - `speak`: if an ElevenLabs key is stored (`getElevenLabsKey()`), POST to `https://api.elevenlabs.io/v1/text-to-speech/<default-voice-id>` with `xi-api-key` header and the text in the body; decode the returned audio blob and play it via a Web Audio API `AudioContext`; if no key is stored, use `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`
  - `stopSpeaking`: cancel any active ElevenLabs audio or `window.speechSynthesis.cancel()`
  - `isSpeaking`: returns `true` while audio is playing
  - Default ElevenLabs voice ID: `"21m00Tcm4TlvDq8ikWAM"` (Rachel) — define as a named constant
  - Handle network errors from ElevenLabs gracefully: fall back to `speechSynthesis` and log a warning (never log the key)

**Commit:** `feat(VC-05): tts.ts service — ElevenLabs with speechSynthesis fallback`

---

### Group 3 — Unified Chat Panel (A-28, A-29, VC-01, VC-02, VC-03, VC-05, VC-06, VC-07)

Rewrite `src/components/ai/ChatPanel.tsx` as the unified text + voice panel. **Delete `src/components/ai/VoiceChatPanel.tsx`** — it is replaced entirely by this unified panel.

- [ ] **Panel layout** (A-28):
  - Centred overlay at 70% viewport width × 70% viewport height (same as Reading panel, A-32); rendered via React portal
  - Heading: node label
  - Scrollable **content area** filling available height: AI responses (text and voice) accumulate here as markdown blocks; never cleared mid-session
  - **Bottom bar**: text input field (flex-grow) + mic icon button flush to its right + send button
  - State indicator (Listening / Thinking / Speaking) rendered inside the content area or above the bottom bar when voice mode is active (VC-02)
  - Dismiss button in the top-right corner, always visible

- [ ] **Text mode** (A-29, default on open):
  - User types in the text input; submits via Enter or send button
  - On submit: if voice mode is currently active, deactivate it first (stop `SpeechRecognition`, stop TTS) — VC-01
  - Call `chatNode(...)` (existing A-33 API call); append the AI response as a markdown block to the content area
  - No TTS in text mode

- [ ] **Voice mode toggle** (VC-01):
  - Check `SpeechRecognition` availability once on mount; if unavailable, mic button is permanently dimmed and shows the unsupported message on click (VC-06)
  - Mic button: `opacity: 0.35 / pointerEvents: none` when AI Assist is off (K-08)
  - Clicking mic while in text mode → enter voice mode: instantiate `SpeechRecognition` (`continuous: true`, `interimResults: false`), start it, show state indicator `Listening`
  - Clicking mic while in voice mode → exit voice mode: stop `SpeechRecognition`, stop TTS, hide state indicator
  - Submitting a text message while in voice mode → exit voice mode (same stop sequence) then process the text turn

- [ ] **Voice turn handler** `handleVoiceTurn(transcript)` (VC-03, VC-04, VC-05):
  1. Stop TTS immediately (`stopSpeaking()`)
  2. Set state to `Thinking`
  3. Call `voiceChat(transcript, nodeLabel, nodeDescription, focusQuestion, history, apiKey)`
  4. Append `{ role: 'user', content: transcript }` and `{ role: 'assistant', content: response.speech }` to the shared history (VC-07)
  5. If `response.visual` is present, append its markdown to the content area when audio playback begins (use `onStart` callback — VC-05)
  6. Set state to `Speaking`; call `speak(response.speech, onStart)`
  7. When speech ends, set state back to `Listening`

- [ ] **Conversation history** (VC-07): single unified `history` array shared across text and voice turns; cleared when panel is closed or a different node's Chat is opened

- [ ] On unmount: call `stopSpeaking()`, stop `SpeechRecognition` if active

- [ ] Remove `voiceChatPanelOpen` from `App.tsx` state; only `chatPanelOpen` and `summaryPanelOpen` remain — the voice toggle lives inside ChatPanel

**Commit:** `feat(VC-01,VC-02,VC-03,VC-05,VC-06,VC-07,A-28,A-29): unified Chat panel — centred 70% viewport, text+voice modes, mic toggle next to input`

---

### Group 4 — Voice Chat concept suggestions (VC-08)

Extend the Voice Chat Claude response and VoiceChatPanel to support optional concept suggestions that the user can apply directly to the map.

- [ ] Extend `VoiceChatResponse` in `src/types/index.ts`:
  ```typescript
  interface VoiceChatConcept {
    label: string
    description: string
    relationship: string   // concise 1–4 word edge label, source → concept
  }

  interface VoiceChatResponse {
    speech: string
    visual?: string
    concepts?: VoiceChatConcept[]   // absent when AI has no suggestions
  }
  ```
- [ ] Update the `voiceChat` system prompt in `src/lib/claude.ts` to instruct Claude that when the user asks for concept suggestions it must include a `concepts` array in the JSON response — each entry having `label`, `description`, and `relationship`; otherwise the field must be omitted entirely (never an empty array)
- [ ] Update `parseVoiceChatResponse` in `src/lib/claude.ts` to validate and pass through the optional `concepts` array
- [ ] In `VoiceChatPanel.tsx`, after appending any `visual` markdown, check for `response.concepts`; if present, render an interactive checklist block below the latest visual content:
  - Each concept row: checkbox + bold label + relationship tag (small, styled like an edge label) + description text
  - Apply button below the list: dimmed (`opacity: 0.35`, `pointerEvents: 'none'`) until at least one checkbox is checked
  - On Apply: for each checked concept, call the `onApplyConcepts` callback (see below); replace the checklist block with a confirmation message (e.g. "✓ Added to map"); the block remains in the accumulated content
- [ ] Add `onApplyConcepts` prop to `VoiceChatPanel`:
  ```typescript
  onApplyConcepts: (concepts: VoiceChatConcept[], originNodeId: string) => void
  ```
- [ ] Implement `handleApplyVoiceConcepts` in `App.tsx`:
  - For each concept in the array, create a `ConceptNode` with the concept's `label` and `description`
  - Position new nodes distributed around the origin node (use the same offset pattern as `appendConceptNodes`)
  - For each concept, create an edge from `originNodeId` to the new node using `concept.relationship` as the label
  - Group concepts sharing the same `relationship` value into a branching edge (C-10 / A-41 pattern); concepts with distinct relationship labels produce individual edges
  - Call `canvasRef.current.appendConceptNodes(newNodes, newEdges)` (or equivalent canvas mutation) to apply

**Commit:** `feat(VC-08): voice chat concept suggestions — checklist block, Apply creates nodes + edges on canvas`

---

### Group 5 — UI Verification (Playwright MCP)

Start the dev server and use Playwright MCP + Chrome to verify:

- [ ] Chat panel opens centred at approximately 70% viewport width and height (not sidebar)
- [ ] Text input and mic icon button are both visible in the bottom bar; mic is to the right of the input
- [ ] Typing a message and submitting produces a markdown response in the content area; no audio plays
- [ ] Mic button is dimmed when AI Assist is off
- [ ] Clicking the mic button activates voice mode; state indicator shows `Listening`
- [ ] Speaking into the microphone transitions to `Thinking` then `Speaking`
- [ ] AI voice response is read aloud (browser TTS audible)
- [ ] If the AI returns visual content, it appears in the content area when audio begins
- [ ] Visual content from a second voice turn appends below the first (does not replace)
- [ ] Clicking the mic button while in voice mode returns to text mode; state indicator disappears
- [ ] Typing and submitting a message while in voice mode exits voice mode and sends the text turn
- [ ] Dismiss button closes the panel
- [ ] Re-opening Chat for the same node starts with empty content (fresh history)
- [ ] On a browser without SpeechRecognition, the mic button is dimmed and shows unsupported message on click
- [ ] When the AI returns a `concepts` array, a checklist block appears in the visual area with checkboxes, labels, relationship tags, and descriptions
- [ ] Apply button is dimmed until at least one concept is checked
- [ ] Checking concepts and clicking Apply adds nodes to the canvas connected to the originating node
- [ ] Concepts sharing the same relationship label produce a branching edge; differing labels produce individual edges
- [ ] After Apply, the checklist is replaced with a confirmation indicator
- [ ] No errors in browser console

Log any visual or interaction issues found as `/feedback` entries before committing.

---

## Browser Compatibility Notes

- `SpeechRecognition` / `webkitSpeechRecognition`: Chrome and Edge only. Firefox and Safari do not support it. Always check for availability and degrade gracefully (VC-06).
- `speechSynthesis`: available in all modern browsers. Safe to use as default TTS.
- ElevenLabs TTS: requires `getElevenLabsKey()` to return a non-null value. No key = `speechSynthesis` fallback. Never surface the key in any error message or console output.

---

## Scope Boundaries

| In scope | Out of scope |
|---|---|
| Rewriting `ChatPanel.tsx` as unified text + voice panel (A-28, A-29, VC-01–VC-07) | Creating a new separate panel for voice |
| Deleting `VoiceChatPanel.tsx` (replaced by unified ChatPanel) | Settings UI for K-16/K-17 — already done by Settings Agent |
| `tts.ts` service with ElevenLabs + speechSynthesis | ElevenLabs voice selection beyond K-17 |
| `voiceChat` function in `claude.ts` | — |
| VC-08 concept suggestions checklist + Apply → canvas nodes/edges | — |

---

## Output Checklist

When done, the following must exist or be updated:

```
src/
├── components/ai/
│   ├── ChatPanel.tsx           ✓ rewritten as unified text+voice panel (A-28, A-29, VC-01–VC-07)
│   └── VoiceChatPanel.tsx      ✗ deleted — replaced by unified ChatPanel
├── lib/
│   ├── claude.ts               ✓ voiceChat function + VC-08 concepts support
│   └── tts.ts                  ✓ TTS service (already exists)
├── App.tsx                     ✓ handleApplyVoiceConcepts wired; voiceChatPanelOpen state removed
└── types/index.ts              ✓ VoiceChatMessage, VoiceChatResponse, VoiceChatConcept added
```

---

## Handoff

When this branch is merged to main, voice chat is live. Trigger the QA Agent to add E2E tests for VC-01–VC-07.

Run `/feedback` for any issues encountered. Run `/improve` if 3+ feedback entries are open.

---

*Voice Agent Spec v1.2 — April 2026 (v1.0: VC-01–VC-07, K-16 dependency, Web Speech API + ElevenLabs TTS; v1.1: added VC-08 — concept suggestions checklist with Apply → canvas nodes/edges; v1.2: unified panel redesign — ChatPanel rewritten as single text+voice surface, mic button next to text input, no separate VoiceChatPanel)*
