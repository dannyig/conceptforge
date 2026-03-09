# ConceptForge — CLAUDE.md

> Operating instructions for all Claude Code agents working on this project.
> Read this file in full before taking any action in this repository.

---

## 1. Project Overview

<!--
One paragraph describing what ConceptForge is, what it does, and who it is for.
Includes the full tech stack inline (React, Vite, TypeScript, React Flow, Claude API).
States the deployment target (fly.io) and the no-backend constraint.
Links to requirements/requirements.md for full feature scope.
-->

_To be completed by the Scaffolder agent._

---

## 2. Development Commands

<!--
Exact pnpm scripts for every common operation, grouped into categories:
- Development: dev server, hot reload
- Build: production build, preview
- Quality: lint, type-check, format
- Testing: unit tests, E2E tests, coverage
- Deployment: fly deploy

Each script listed as: `pnpm <script>` followed by a one-line description.
No ambiguity — agents must be able to run the right command without inference.
-->

_To be completed by the Scaffolder agent._

---

## 3. Project Structure

<!--
Annotated directory tree of the full src/ folder and root-level config files.
Every folder listed with a one-line description of what belongs inside it.
Covers: components/, hooks/, lib/, types/, tests/unit/, tests/e2e/.
Agents use this to know exactly where to create new files without asking.
-->

_To be completed by the Scaffolder agent._

---

## 4. Architecture

<!--
Describes the key architectural decisions that govern how the app is built:
- Component model: functional components only, no class components
- State management: local React state only (no Redux, no Zustand for MVP)
- Canvas layer: how React Flow is integrated and where canvas state lives
- AI layer: how the Claude API client is structured and called
- Data flow: how user prompts move from input → AI → canvas render
- No backend: explains the no-server constraint and its implications
- Export layer: how JSON save/load and PNG export are implemented
References src/types/index.ts as the single source of type truth.
-->

_To be completed by the Scaffolder agent._

---

## 5. TypeScript Contracts

<!--
Defines the rule that types are always written before implementation.
Lists the canonical shared types every agent must program to (ConceptNode, ConceptEdge, MapData, ClaudeMapResponse).
States the location of all shared types: src/types/index.ts.
Rules: no `any`, use `unknown` and narrow, annotate all function return types.
Explains the AI output contract — what shape Claude API responses must conform to before being passed to the canvas.
-->

_To be completed by the Scaffolder agent._

---

## 6. Code Style Standards

<!--
Covers all coding conventions agents must follow consistently:
- TypeScript: strict mode, no `any`, prefer `unknown`, explicit return types
- Components: functional only, props destructured inline, no default exports except pages
- Styling: inline styles throughout (no CSS files, no CSS modules, no Tailwind) — dark theme tokens defined in a central constants file
- Imports: grouped as react → third-party → local, alphabetical within groups
- Naming: PascalCase for components, camelCase for hooks and utilities, UPPER_SNAKE for constants
- File naming: kebab-case for all files, .tsx for components, .ts for utilities
- No commented-out code committed
- Prefer early returns over nested conditionals
-->

_To be completed by the Scaffolder agent._

---

## 7. Testing

<!--
Describes the full testing strategy agents must follow:
- Unit tests: Vitest — located in tests/unit/, mirroring src/ folder structure
- E2E tests: Playwright — located in tests/e2e/, one spec file per feature area
- Coverage: minimum thresholds (to be defined by Scaffolder)
- Test naming: describe('<ComponentName>') / it('should <behaviour>')
- Mocking: how to mock the Claude API client in tests (no real API calls in tests)
- QA Agent responsibility: the QA Agent writes tests after each feature agent completes
- Gate: all tests must pass before any merge to main
- UI Verification gate: frontend feature agents (Canvas, Settings, AI, Persistence) must use
  Playwright MCP + Chrome to visually verify their feature before committing — this is
  separate from and in addition to the automated Playwright E2E tests run in CI
-->

_To be completed by the Scaffolder agent._

---

## 8. Git Conventions

<!--
All branching and commit rules agents must follow:
- Branch naming: feature/<req-id>-<short-description> | fix/<short-description> | chore/<short-description>
  Examples: feature/C-01-react-flow-canvas, feature/A-02-map-generation, fix/node-duplicate-on-expand
- Commit format: Conventional Commits — feat(C-01): add React Flow canvas with pan and zoom
- One branch per requirement ID — no bundling unrelated changes
- main is always deployable — never commit broken code directly to main
- PR merge requires CI green — no manual overrides
-->

_To be completed by the Scaffolder agent._

---

## 9. Agent Roles & Responsibilities

<!--
Defines each named agent in the ConceptForge development system, their scope, and what they must not touch:
- Scaffolder: project setup, toolchain, CLAUDE.md, shared types, CI/CD — runs first, only once
- Canvas Agent: React Flow canvas, custom nodes, edges, pan, zoom, minimap (C-01 → C-07)
- AI Agent: Claude API client, prompt templates, map generation, node expansion (A-01 → A-09)
- Settings Agent: API key input panel, localStorage management, validation (K-01 → K-04)
- Persistence Agent: JSON save/load, PNG export (P-01 → E-02)
- QA Agent: writes and runs Vitest unit tests and Playwright E2E tests after each agent completes
- Improvement Agent: processes feedback, updates CLAUDE.md/agentspecs/tooling, records ADRs — triggered by /improve
- Requirements Agent: discovers and formalises requirements via Q&A with the human; updates requirements.md/.html and downstream docs — triggered by /requirements; runs before any implementation agent is assigned

Each agent reads this file, reads their requirement IDs in requirements/requirements.md, and reads src/types/index.ts before writing a single line of code.
Agents do not modify code outside their defined scope without explicit instruction.
-->

_To be completed by Scaffolder agent after project initialisation._

---

## 10. Spec-Driven Workflow

<!--
Describes the full lifecycle of how a feature moves from requirement to deployed code:
1. Human assigns a requirement ID to an agent
2. Agent reads the requirement in requirements/requirements.md
3. Agent reads shared types in src/types/index.ts
4. Agent creates a feature branch following the naming convention
5. Agent implements the feature with tests
6. Agent runs pnpm lint && pnpm test — fixes all failures before committing
7. Agent commits with a Conventional Commit referencing the requirement ID
8. CI pipeline runs automatically on push
9. On CI green, merge to main triggers auto-deploy to fly.io
10. Human reviews deployed app on https://conceptforge.fly.dev

Also references the devmethod/devmethod.md for the full delivery sequence and MVP agent ordering.
-->

_To be completed by the Scaffolder agent._

---

## 11. Skill Activation

<!--
Conditional routing table: when a task matches a skill, the agent activates that skill before proceeding.
Format: task type → skill name → skill file path

Expected entries:
- UI component development → frontend-design skill (installed from Anthropic plugin)
- Writing tests → testing-patterns skill
- Claude API integration → ai-output-contract reference in this file
- Canvas node development → React Flow pro examples reference
- Export implementation → html2canvas / React Flow snapshot docs

Agents must check this table before implementing any task.
-->

_To be completed after skills are installed._

---

## 12. Critical Rules

> **Active rule — Paired Document Sync:** Where a `.md` file has a paired `.html` file, both must be updated in the same commit. Pairs: `devmethod/devmethod.md ↔ devmethod/devmethod.html` · `requirements/requirements.md ↔ requirements/requirements.html` · `resources/resources.md ↔ resources/resources.html`. This applies to every agent including the Improvement Agent.

> **Active rule — UI Verification Gate:** All frontend feature agents (Canvas, Settings, AI, Persistence) must verify their work in Chrome using the Playwright MCP before committing. Start the dev server (`pnpm dev`), then use Playwright MCP to navigate and interact with the feature — confirm visual correctness, interactive behaviour, and a clean browser console. This is a mandatory step between "fix all failures" and "commit".

<!--
Non-negotiable rules that apply to every agent on every task. Organised into named subsections:

### UI States
Every interactive component must handle all four states: loading, error, empty, success.
No component may be committed that shows only the success state.

### Error Handling
All Claude API calls must have error handling with user-visible feedback.
No silent failures — errors surface to the UI.
No `console.error` as a substitute for proper error state.

### Async Operations
Buttons that trigger async actions must be disabled while the operation is in progress.
Show a loading indicator on the triggering element, not a global spinner.

### API Key Safety
The Claude API key must never appear in any network request except to api.anthropic.com.
Never log the API key — not even the first N characters.
Never commit the API key — not even in a test file.

### Canvas Mutations
All canvas state mutations go through React Flow's setNodes / setEdges.
Never mutate node or edge objects directly.

### Paired Document Sync
Where a `.md` file has a corresponding `.html` file, both must be updated in the same commit — never update one without the other.
Paired files in this project:
- `devmethod/devmethod.md` ↔ `devmethod/devmethod.html`
- `requirements/requirements.md` ↔ `requirements/requirements.html`
- `resources/resources.md` ↔ `resources/resources.html`
This rule applies to all agents, including the Improvement Agent.
-->

_To be completed by the Scaffolder agent._

---

## 13. Security

<!--
Frontend-specific security rules for an app that handles user API keys:
- API key stored only in localStorage under a namespaced key
- API key passed directly from localStorage to fetch() — never to any intermediate server
- No environment variables committed to source control (.env files in .gitignore)
- No third-party analytics or tracking scripts (no data leaves the browser except to Claude API)
- Content Security Policy considerations for the nginx deployment
- Input sanitisation: all Claude API responses validated against ClaudeMapResponse type before render
-->

_To be completed by the Scaffolder agent._

---

## 14. Deployment

<!--
Step-by-step deployment instructions for agents:
- Deployment target: fly.io — app name: conceptforge
- Build process: pnpm build → dist/ → copied into nginx Docker container
- fly.toml location and key configuration values
- How to deploy: `fly deploy` from the project root
- URL: https://conceptforge.fly.dev
- CI/CD: GitHub Actions deploy.yml triggers automatically on merge to main
- Agents should not run fly deploy manually unless explicitly instructed
-->

_To be completed by the Scaffolder agent._

---

## 15. Known Gaps & Out of Scope

<!--
Explicit list of what is intentionally absent from the MVP.
Agents must not implement these unless a requirement ID is assigned:
- No user authentication or accounts
- No backend server or database
- No real-time collaboration
- No mobile or touch support
- No SVG export (post-MVP)
- No document upload or URL ingestion (post-MVP)
- No undo/redo history (post-MVP)
- No multi-language UI
- No analytics or telemetry

This section prevents agents from gold-plating or adding unrequested features.
-->

_To be completed by the Scaffolder agent._

---

## 16. Steering Documents

<!--
Pointers to persistent project documents that survive across agent sessions.
Agents must read the relevant steering documents before starting work:

| Document | Path | Purpose |
|---|---|---|
| Requirements | requirements/requirements.md | Full feature spec with requirement IDs |
| Development Method | devmethod/devmethod.md | Agent roles, workflow, delivery sequence |
| Resources | resources/resources.md | Reference projects and learning materials |
| Type Contracts | src/types/index.ts | Shared TypeScript interfaces — source of truth |

If a document does not yet exist, the Scaffolder agent is responsible for creating it.
-->

_Paths to be confirmed after project scaffold is complete._

---

## 17. Feedback & Continuous Improvement

<!--
Describes the feedback loop that allows the development process to improve over time.

### Raising Feedback
Any agent that encounters a problem, ambiguity, or friction point must log it immediately.
Run /feedback in Claude Code, or manually create a file in feedback/ using feedback/TEMPLATE.md.
Do not wait until the end of a session — log as you go.

### Feedback Categories
tooling | types | claude-md | agentspec | structure | ci-cd | testing | react-flow | ai-layer | process

### Processing Feedback
The Improvement Agent (/improve) reads all open feedback entries, groups by category,
identifies patterns, and implements fixes to: CLAUDE.md, agentspecs/, tooling config, src/types/index.ts.
It then updates LESSONS.md and marks feedback entries resolved.

### Architecture Decisions
Significant tooling or architectural decisions are recorded as ADRs in decisions/.
Agents must not change anything marked `accepted` in an ADR without creating a superseding ADR.

### Cadence
Run /improve:
- After each feature agent completes and merges to main
- When 3+ open feedback entries accumulate
- Before starting a new agent session
- Explicitly by the human at any time

### Key Files
- feedback/TEMPLATE.md    — template for new feedback entries
- feedback/README.md      — category guide and processing overview
- decisions/README.md     — ADR index
- LESSONS.md              — running log of improvements and patterns
- agentspecs/06-improvement-agent.md — full Improvement Agent task spec
-->

_See feedback/, decisions/, and LESSONS.md for current state._

---

*CLAUDE.md v0.4 — Added Requirements Agent to Section 9 comment; all content sections pending Scaffolder agent — March 2026*
