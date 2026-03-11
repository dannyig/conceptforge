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

ConceptForge is an AI-assisted concept mapping tool that lets users generate and explore interactive knowledge graphs via the Claude API. Users enter a topic or question; ConceptForge calls the Anthropic Claude API to produce a structured graph of related concepts, and renders it as a fully interactive canvas. Users can expand any node to drill deeper, pan and zoom the canvas, save their maps as JSON, and export them as PNG.

**Tech stack:** React 19 · Vite 7 · TypeScript 5 (strict) · @xyflow/react 12 (React Flow) · Anthropic Claude API (direct browser fetch).

**Constraints:** No backend server or database. Everything runs in the browser. Users supply their own Anthropic API key, which is stored only in `localStorage` and passed directly to `api.anthropic.com` — no proxy, no server-side handling.

**Deployment:** Dockerised static SPA (Vite build → nginx) deployed to fly.io. App name: `conceptforge`. Region: `lhr`.

Full feature scope and requirement IDs: `requirements/requirements.md`.

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

### Development

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server with HMR on `http://localhost:5173` |
| `pnpm preview` | Serve production build locally on `http://localhost:4173` |

### Build

| Command | Description |
|---|---|
| `pnpm build` | `tsc -b && vite build` — type-check then emit production bundle to `dist/` |

### Quality

| Command | Description |
|---|---|
| `pnpm lint` | ESLint flat config over `src/` (auto-fixable issues resolved in pre-commit hook) |
| `pnpm typecheck` | TypeScript strict-mode check with no emit — run before every commit |
| `pnpm format` | Prettier format all `src/` files |

### Testing

| Command | Description |
|---|---|
| `pnpm test` | Vitest unit tests — single run |
| `pnpm test:watch` | Vitest in interactive watch mode |
| `pnpm test:coverage` | Vitest with coverage report |
| `pnpm test:e2e` | Playwright E2E suite — auto-starts `pnpm dev` if not already running |

### Deployment

Agents must **not** run deployment commands manually unless explicitly instructed. Deployment is handled automatically by GitHub Actions on merge to `main`.

```
flyctl deploy --remote-only   # CI only — requires FLY_API_TOKEN env var
```

---

## 3. Project Structure

<!--
Annotated directory tree of the full src/ folder and root-level config files.
Every folder listed with a one-line description of what belongs inside it.
Covers: components/, hooks/, lib/, types/, tests/unit/, tests/e2e/.
Agents use this to know exactly where to create new files without asking.
-->

```
conceptforge/
├── src/
│   ├── App.tsx                    # Root component — canvas layout and top-level state
│   ├── main.tsx                   # React entry point — createRoot + StrictMode
│   ├── test-setup.ts              # Vitest setup — imports @testing-library/jest-dom
│   ├── components/
│   │   ├── canvas/                # React Flow canvas, custom node types, edge types
│   │   ├── ai/                    # Prompt panel, node context menu (AI actions)
│   │   ├── toolbar/               # Top toolbar — save, load, export, clear actions
│   │   └── settings/              # API key input panel, settings drawer
│   ├── hooks/                     # Custom React hooks (shared logic across components)
│   ├── lib/
│   │   ├── claude.ts              # Anthropic API client — generateMap, expandNode, parseClaudeResponse
│   │   ├── graph.ts               # Graph utilities — autoLayout (Dagre or ELK)
│   │   └── export.ts              # JSON save/load (MapData), PNG export
│   └── types/
│       └── index.ts               # Shared TypeScript contracts — source of truth for all agents
├── tests/
│   ├── unit/                      # Vitest unit tests — mirror src/ folder structure
│   └── e2e/                       # Playwright E2E tests — one spec file per feature area
├── .claude/
│   ├── commands/                  # Slash command prompt files
│   └── skills/                    # Installed skills (playwright-best-practices, web-design-guidelines, vercel-react-best-practices)
├── .github/workflows/
│   ├── ci.yml                     # PR and push CI — lint, typecheck, test, E2E
│   └── deploy.yml                 # Auto-deploy to fly.io on merge to main
├── agentspecs/                    # Per-agent task specifications
├── requirements/                  # requirements.md + requirements.html
├── devmethod/                     # devmethod.md + devmethod.html
├── decisions/                     # Architecture Decision Records (ADRs)
├── feedback/                      # Feedback entries and TEMPLATE.md
├── Dockerfile                     # Multi-stage: Node 20 build → nginx:alpine serve
├── nginx.conf                     # SPA fallback, gzip, asset caching
├── fly.toml                       # fly.io config (app=conceptforge, region=lhr)
├── vite.config.ts                 # Vite + Vitest config, @/ path alias
├── tsconfig.json                  # TypeScript strict config, project references
├── tsconfig.node.json             # TypeScript config for Vite config file (composite: true)
├── eslint.config.js               # ESLint v10 flat config
├── .prettierrc                    # Prettier formatting rules
└── playwright.config.ts           # Playwright config (chromium, baseURL: localhost:5173)
```

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

### Component model
Functional components only — no class components. Props are destructured inline at the function signature. Named exports for all components; default exports only for page-level components (currently just `App`).

### State management
Local React state only for MVP: `useState`, `useCallback`, `useMemo`, `useRef`. No Redux, no Zustand, no Jotai. Canvas node and edge state lives at the `App` level and is passed down to React Flow. Settings (API key) state lives in the Settings component backed by `localStorage`.

### Canvas layer
`@xyflow/react` (React Flow v12) owns the canvas. Nodes and edges are stored as `ConceptNode[]` / `ConceptEdge[]` (from `src/types/index.ts`) and adapted to React Flow's `Node<ConceptNode>` / `Edge<ConceptEdge>` format inside the Canvas component. All canvas mutations go through `setNodes` / `setEdges` — never direct object mutation.

### AI layer
`src/lib/claude.ts` is the only place in the codebase that calls the Anthropic API. It reads the API key from `localStorage`, constructs the fetch request, and returns a typed `ClaudeMapResponse`. The response is validated and mapped to `MapData` by `parseClaudeResponse` before any canvas state is updated.

### Data flow
```
User prompt input
  → claude.ts generateMap(prompt, apiKey)
  → Anthropic API (api.anthropic.com)
  → ClaudeMapResponse (validated)
  → parseClaudeResponse → MapData { nodes: ConceptNode[], edges: ConceptEdge[] }
  → autoLayout (graph.ts) → positioned nodes
  → setNodes / setEdges → React Flow canvas re-renders
```

### No backend
ConceptForge is a pure client-side SPA. There is no Express/Fastify/Next.js server. The user provides their Anthropic API key through the Settings panel; it is stored in `localStorage` and sent directly to `api.anthropic.com` in the `Authorization` header — it never touches any intermediate server.

### Export layer
`src/lib/export.ts` handles persistence:
- **JSON save/load:** serialises/deserialises `MapData` to/from a `.json` file via the browser's File API
- **PNG export:** renders the canvas DOM node to a PNG blob and triggers a download
- All validation uses the `MapData` type — malformed JSON is rejected before touching canvas state

---

## 5. TypeScript Contracts

<!--
Defines the rule that types are always written before implementation.
Lists the canonical shared types every agent must program to (ConceptNode, ConceptEdge, MapData, ClaudeMapResponse).
States the location of all shared types: src/types/index.ts.
Rules: no `any`, use `unknown` and narrow, annotate all function return types.
Explains the AI output contract — what shape Claude API responses must conform to before being passed to the canvas.
-->

All shared TypeScript interfaces live in **`src/types/index.ts`** — the single source of truth for all agents. Do not define types inline in component files for anything shared across components.

### Canonical types

```typescript
interface ConceptNode {
  id: string
  label: string
  position: { x: number; y: number }
  type?: 'concept' | 'question' | 'source' | 'insight'
}

interface ConceptEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface MapData {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  focusQuestion?: string   // F-05: persisted with the map; undefined when not set
}

interface ClaudeMapResponse {
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ source: string; target: string; label?: string }>
}

interface ExpandNodeRequest {
  nodeId: string
  nodeLabel: string
  existingNodes: ConceptNode[]
}
```

### Rules
- **Never use `any`.** Use `unknown` and narrow with type guards.
- **Annotate all function return types** — no implicit `any` returns.
- **Types before implementation** — if a new shared type is needed, add it to `src/types/index.ts` before writing the consuming code.
- **AI output contract:** `ClaudeMapResponse` is the validated shape of every Claude API response. `parseClaudeResponse` must throw (not silently swallow) if the response does not conform. Canvas state is only updated with validated data.
- If modifying `src/types/index.ts`, update this section accordingly — the comment at the top of that file says as much.

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

### TypeScript
- Strict mode enforced via `tsconfig.json` (`"strict": true`)
- No `any` — use `unknown` and narrow with type guards
- Explicit return types on all functions
- Path alias `@/` resolves to `src/` — use `@/components/...` not relative `../../...`

### Components
- Functional components only — no class components
- Props destructured inline: `function Foo({ bar, baz }: FooProps)`
- Named exports for all components; default export only for `App`
- No inline anonymous arrow functions as component definitions

### Styling
- **Inline styles throughout** — no `.css` files, no CSS modules, no Tailwind
- All colour tokens, spacing constants, and timing values defined in `src/lib/theme.ts`
- Never hardcode a hex colour inline — always reference a theme constant
- Font family defined once in `theme.ts`; applied via `fontFamily` in style objects

### Imports
- Grouped in order: `react` → third-party → `@/` local imports
- Alphabetical within each group
- No barrel re-exports that inflate bundle size (see `vercel-react-best-practices: bundle-barrel-imports`)

### Naming
- `PascalCase` — React components and TypeScript interfaces/types
- `camelCase` — hooks, utility functions, variables, props
- `UPPER_SNAKE_CASE` — constants (colour tokens, timing values, config values in `theme.ts`)
- `kebab-case` — all file names: `concept-node.tsx`, `use-canvas-state.ts`
- File extensions: `.tsx` for components, `.ts` for utilities, hooks, and types

### Conventions
- No commented-out code committed
- Prefer early returns over nested conditionals
- No magic numbers — name every constant
- ESLint flat config enforces these rules automatically — fix all lint errors before committing
- Prettier auto-formats on commit via `lint-staged`

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

### Unit tests — Vitest
- Location: `tests/unit/` — mirroring `src/` folder structure
- Runner: `pnpm test` (single run) · `pnpm test:watch` (watch mode)
- Globals enabled — `describe`, `it`, `expect`, `vi` available without imports
- Test environment: `jsdom` (configured in `vite.config.ts`)
- Setup file: `src/test-setup.ts` (imports `@testing-library/jest-dom`)
- **Naming:** `describe('<ComponentName>')` / `it('should <behaviour>')`
- **Mocking Claude API:** use `vi.mock('@/lib/claude')` — never make real API calls in unit tests
- Use `@testing-library/react` for component tests — query by role, label, text (not implementation details)

### E2E tests — Playwright
- Location: `tests/e2e/` — one spec file per feature area
- Runner: `pnpm test:e2e` (auto-starts dev server on `localhost:5173`)
- Browser: Chromium only (configured in `playwright.config.ts`)
- **Mock Claude at network level** using Playwright's `page.route()` — see `playwright-best-practices` skill: `references/network-advanced.md`
- Before writing any Playwright tests, activate the `playwright-best-practices` skill (see Section 11)

### Coverage
- `pnpm test:coverage` produces a V8 coverage report
- Minimum thresholds to be set after the first feature agent delivers working code

### UI Verification gate
All frontend feature agents (Canvas, Settings, AI, Persistence) must verify their feature visually in Chrome using the Playwright MCP **before** committing. This is mandatory and separate from the automated Playwright E2E suite — see Section 12 Critical Rules.

### QA Agent responsibility
The QA Agent writes both Vitest unit tests and Playwright E2E tests **after** each feature agent completes. Feature agents write stubs and basic smoke tests; the QA Agent writes thorough coverage. See `agentspecs/05-qa-agent.md`.

### Gate
All tests must pass (`pnpm test && pnpm test:e2e`) before any merge to `main`. CI enforces this automatically.

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

### Branch naming
```
feature/<req-id>-<short-description>   e.g. feature/C-01-react-flow-canvas
fix/<short-description>                e.g. fix/node-duplicate-on-expand
chore/<short-description>              e.g. chore/update-playwright-config
docs/<short-description>               e.g. docs/add-adr-001
```
- One branch per requirement ID — never bundle unrelated requirement changes
- `main` is always deployable — never commit broken code directly to `main`

### Branch verification — mandatory before every commit

**Never commit when `git branch --show-current` returns `main`.** This is a hard stop — not a guideline.

Before every commit, run:
```bash
git branch --show-current   # must NOT return "main"
```
If the output is `main`, stop immediately. Switch to the correct feature branch, re-stage the changes, and then commit. Committing directly to `main` bypasses PR review, triggers auto-deploy without CI, and makes the change untrackable.

### Pre-PR main alignment — mandatory before raising a PR

A branch must be zero commits behind `origin/main` before a PR is raised. Before pushing to origin and opening a PR, run:
```bash
git fetch origin main
git merge origin/main --no-edit
# Resolve any conflicts, then re-run: pnpm lint && pnpm typecheck && pnpm test
```
Never raise a PR from a branch that GitHub reports as "X commits behind main" — the diff will be incomplete and may hide conflicts that break CI after merge.

### Commit format — Conventional Commits
```
<type>(<scope>): <short description>

feat(C-01): add React Flow canvas with pan and zoom
fix(A-03): handle empty Claude API response gracefully
chore: update pnpm lockfile
docs: populate CLAUDE.md with full project configuration
test(C-02): add Playwright E2E for node selection
```

Scopes are requirement IDs where applicable: `C-01`, `A-02`, `K-01`, `P-01`.

### Merge rules
- PRs require CI green — no manual overrides
- Squash or merge commit — no rebase merges (keep history readable)
- Delete branch after merge

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

| Agent | Scope | Spec | Requirements |
|---|---|---|---|
| **Scaffolder** | Project setup, toolchain, CLAUDE.md, shared types, CI/CD — runs first, only once | `agentspecs/00-scaffolder.md` | — |
| **Canvas Agent** | React Flow canvas, custom nodes, edges, pan, zoom, minimap | `agentspecs/01-canvas-agent.md` | C-01 → C-07 |
| **Settings Agent** | API key input panel, localStorage management, validation | `agentspecs/02-settings-agent.md` | K-01 → K-04 |
| **AI Agent** | Claude API client, prompt templates, map generation, node expansion | `agentspecs/03-ai-agent.md` | A-01 → A-09 |
| **Persistence Agent** | JSON save/load, PNG export | `agentspecs/04-persistence-agent.md` | P-01 → E-02 |
| **QA Agent** | Vitest unit tests and Playwright E2E tests after each feature agent | `agentspecs/05-qa-agent.md` | All |
| **Improvement Agent** | Processes feedback, updates CLAUDE.md/agentspecs/tooling, records ADRs — triggered by `/improve` | `agentspecs/06-improvement-agent.md` | — |
| **Requirements Agent** | Discovers and formalises requirements via Q&A; updates requirements.md/.html and downstream docs — triggered by `/requirements`; runs before any implementation agent | `agentspecs/07-requirements-agent.md` | — |

**Scope rules:**
- Each agent reads this file, their requirement IDs in `requirements/requirements.md`, and `src/types/index.ts` before writing a single line of code
- Agents do not modify code outside their defined scope without explicit instruction
- Frontend feature agents (Canvas, Settings, AI, Persistence) must run the UI Verification gate before committing (Section 12)

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

1. Human assigns a requirement ID to an agent (e.g. "Canvas Agent — implement C-01")
2. Agent reads `requirements/requirements.md` for the requirement details
3. Agent reads `src/types/index.ts` for shared type contracts
4. Agent reads the relevant agentspec in `agentspecs/`
5. Agent creates a feature branch: `feature/C-01-react-flow-canvas`
   **5a. Verify:** run `git branch --show-current` — output must be the feature branch name. If it returns `main`, stop and switch branches before writing any code.
6. Agent implements the feature, writing tests alongside
7. Agent runs `pnpm lint && pnpm typecheck && pnpm test` — fixes all failures
8. Frontend agents run the UI Verification gate (Playwright MCP in Chrome) before committing
   **8a. Branch check:** run `git branch --show-current` — output must NOT be `main`. If it is, switch to the feature branch and re-stage before continuing.
   **8b. Align with main:** run `git fetch origin main && git merge origin/main --no-edit`. Resolve any conflicts. Re-run `pnpm lint && pnpm typecheck && pnpm test`. The branch must be zero commits behind `origin/main` before committing and raising a PR.
9. Agent commits with a Conventional Commit referencing the requirement ID
10. CI pipeline runs automatically on push — lint, typecheck, unit tests, E2E
11. On CI green, merge to `main` triggers auto-deploy to fly.io via `deploy.yml`
12. Human reviews deployed app at `https://conceptforge.fly.dev`
13. Human triggers `/improve` or QA Agent to process feedback and write full test coverage

Full delivery sequence and MVP agent ordering: `devmethod/devmethod.md`.

---

## 11. Skill Activation

> **Active rule — Playwright Skill:** When writing, debugging, or maintaining Playwright tests, activate the `playwright-best-practices` skill before starting. Use its activity-based reference table to load only the relevant guidance for the current task — do not load all reference files at once.

> **Active rule — Web Design Audit:** After completing any UI component group, run `/web-design-guidelines` pointing at the changed component files before committing. This fetches the latest rules from the Vercel Web Interface Guidelines and audits for accessibility, keyboard support, form behaviour, animation, and performance violations. Fix all findings before committing.

> **Active rule — React Best Practices:** When writing or reviewing React components, data fetching, or bundle-related code, consult the `vercel-react-best-practices` skill. **Caveat — ConceptForge is a Vite SPA with no server-side rendering.** Apply rules selectively — see skip list in Section 11 comment below.

<!--
Conditional routing table: when a task matches a skill, the agent activates that skill before proceeding.

### Installed skills

| Skill | Trigger | Path |
|---|---|---|
| `playwright-best-practices` | Any Playwright test work — writing, debugging, flaky tests, mocking, CI/CD | `.claude/skills/playwright-best-practices/SKILL.md` |
| `web-design-guidelines` | After completing any UI component — run as a code audit | `.claude/skills/web-design-guidelines/SKILL.md` |
| `vercel-react-best-practices` | Writing/reviewing React components, data fetching, bundle optimisation | `.claude/skills/vercel-react-best-practices/SKILL.md` |

---

### Playwright skill — reference routing

Consult the skill's activity table to load the right reference file for the task at hand:

| Task | Reference file |
|---|---|
| Writing E2E tests | `references/test-organization.md`, `references/locators.md`, `references/assertions-waiting.md` |
| Testing canvas / React Flow interactions | `references/canvas-webgl.md` |
| Mocking Claude API at network level | `references/network-advanced.md` |
| Testing error states and network failures | `references/error-testing.md` |
| Monitoring browser console errors | `references/console-errors.md` |
| Mocking Date / time for export filenames | `references/clock-mocking.md` |
| Debugging flaky tests | `references/flaky-tests.md`, `references/debugging.md` |
| Fixing selector / locator issues | `references/locators.md`, `references/debugging.md` |
| Structuring tests with Page Object Model | `references/page-object-model.md` |
| Handling file download assertions | `references/file-operations.md` |
| CI/CD Playwright configuration | `references/ci-cd.md` |

---

### vercel-react-best-practices — ConceptForge caveat

ConceptForge is a **Vite SPA** — no Next.js, no SSR, no server components. Apply the skill's 58 rules selectively:

**Skip entirely — not applicable:**
| Rule(s) | Reason |
|---|---|
| All `server-*` rules (8 rules) | No server exists — no RSC, no server actions, no server caching |
| `rendering-hydration-no-flicker` | No SSR hydration |
| `rendering-hydration-suppress-warning` | No SSR hydration |
| `client-swr-dedup` | No SWR dependency in project |

**Apply with adapted interpretation:**
| Rule | Adaptation |
|---|---|
| `bundle-dynamic-imports` | Concept applies — use Vite's `React.lazy()` + `Suspense` instead of `next/dynamic` |

**Apply in full (~45 rules):**
- All `async-*` — directly relevant to Claude API calls in `src/lib/claude.ts`
- `bundle-barrel-imports`, `bundle-defer-third-party`, `bundle-conditional`, `bundle-preload`
- `client-event-listeners`, `client-passive-event-listeners`, `client-localstorage-schema` (API key versioning in localStorage)
- All `rerender-*` (12 rules) — React Flow canvas state makes re-render discipline critical
- `rendering-animate-svg-wrapper`, `rendering-svg-precision` — React Flow renders SVG edges
- `rendering-hoist-jsx`, `rendering-content-visibility`, `rendering-conditional-render`, `rendering-usetransition-loading`
- All `js-*` (12 rules) — universal JS optimisations
- All `advanced-*` (3 rules)

---

### Skills not installed

- `frontend-design` (Anthropic) — principles extracted and baked into CLAUDE.md Section 12 and Canvas Agent spec v1.1 instead
- Claude API integration → AI output contract defined in Section 5 of this file

Agents must check this table before implementing any UI or React work.
-->

---

## 12. Critical Rules

> **Active rule — Paired Document Sync:** Where a `.md` file has a paired `.html` file, both must be updated in the same commit. Pairs: `devmethod/devmethod.md ↔ devmethod/devmethod.html` · `requirements/requirements.md ↔ requirements/requirements.html` · `resources/resources.md ↔ resources/resources.html`. This applies to every agent including the Improvement Agent.

> **Active rule — UI Verification Gate:** All frontend feature agents (Canvas, Settings, AI, Persistence) must verify their work in Chrome using the Playwright MCP before committing. Start the dev server (`pnpm dev`), then use Playwright MCP to navigate and interact with the feature — confirm visual correctness, interactive behaviour, and a clean browser console. This is a mandatory step between "fix all failures" and "commit".

> **Active rule — Visual Design Intentionality:** ConceptForge has a fixed design system defined in `src/lib/theme.ts`. Agents must never hardcode colours or improvise substitutes. Beyond colour tokens, the design must be executed with intentionality — not just functionally correct but visually deliberate:
> - **Micro-interactions:** every interactive element (nodes, buttons, handles, menu items) must have a CSS transition on hover, focus, and active states. No state change should be instant. Timing constants belong in `theme.ts`.
> - **Typography:** node labels must use a characterful font suited to a dark tech tool — never Inter, Roboto, Arial, or unspecified system fonts. Define the font family once in `theme.ts` and apply it everywhere.
> - **Canvas atmosphere:** specify the `<Background>` dot colour, dot size, and gap deliberately in `theme.ts` — do not accept React Flow defaults. The canvas should feel like a crafted space, not a library demo.
> - **Depth and selection:** the selected-node state must feel distinct and intentional — border colour alone is not enough. Use a subtle box-shadow or glow (using the orange accent `#f97316` at low opacity) in addition to the border change.
> - **Anti-slop:** never use purple gradients, soft-pastel shadows, generic pill-shaped nodes, or any pattern that could appear in a random UI kit. Every visual decision must be traceable to the ConceptForge aesthetic: dark, precise, technical, with deliberate orange accents.

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

### API key handling
- The Claude API key is stored **only** in `localStorage` under a namespaced key (e.g. `conceptforge:apiKey`)
- The API key is read from `localStorage` and passed **directly** to `fetch('https://api.anthropic.com/...')` in `src/lib/claude.ts` — it never touches any intermediate server or proxy
- Never log the API key — not even the first N characters, not in error messages, not in console output
- Never commit the API key — not in `.env` files, not in test fixtures, not anywhere in source control
- `.env` files are in `.gitignore` — do not remove this entry

### Input validation
- All Claude API responses are validated against `ClaudeMapResponse` (from `src/types/index.ts`) before being passed to canvas state
- Malformed or unexpected responses from the API throw an error with a user-visible message — never silently render unvalidated data
- User-entered topic strings are passed as plain text in the prompt — no HTML rendering, no eval

### No third-party telemetry
- No analytics scripts, no tracking pixels, no external font CDNs
- The only external network requests are to `api.anthropic.com` — nothing else leaves the browser
- nginx config does not load any external resources

### nginx deployment
- nginx serves static files only — no server-side execution
- SPA fallback (`try_files $uri /index.html`) is the only dynamic routing behaviour
- Static assets served with `Cache-Control: public, immutable` (1-year expiry)
- `index.html` served with `Cache-Control: no-cache` to ensure fresh deploys are picked up

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

### Target
- **App name:** `conceptforge`
- **Region:** `lhr` (London)
- **URL:** `https://conceptforge.fly.dev`
- **Config:** `fly.toml` (project root)
- **VM:** 256 MB RAM · shared CPU · 1 vCPU · auto-stop/start machines

### Build process
```
pnpm build          # TypeScript compile + Vite bundle → dist/
docker build .      # Multi-stage: Node 20 alpine (build) → nginx:alpine (serve)
                    # dist/ copied into /usr/share/nginx/html
                    # nginx listens on port 8080 (mapped to fly.io internal_port)
```

### CI/CD auto-deploy
GitHub Actions `deploy.yml` triggers on every push to `main`:
1. Checkout + pnpm install + `pnpm build` (build verification)
2. `flyctl deploy --remote-only` using `FLY_API_TOKEN` secret

**Agents must not run `flyctl deploy` manually** unless explicitly instructed by the human. Deployment is always triggered by merging to `main`.

### Manual deploy (emergency only)
```bash
flyctl deploy --remote-only   # requires FLY_API_TOKEN set in shell environment
```

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

The following are **intentionally absent** from the MVP. Agents must not implement these features unless a requirement ID is explicitly assigned by the human:

| Out of scope | Notes |
|---|---|
| User authentication or accounts | No login, no sessions, no user data stored server-side |
| Backend server or database | No Express, no Supabase, no Firebase — pure SPA |
| Real-time collaboration | Single-user tool for MVP |
| Mobile or touch support | Desktop browser only for MVP |
| SVG export | Post-MVP — PNG export only in MVP |
| Document upload or URL ingestion | Post-MVP |
| Undo/redo history | Post-MVP |
| Multi-language UI | English only |
| Analytics or telemetry | Intentionally excluded — see Section 13 |
| Map sharing / public URLs | Post-MVP |
| Keyboard shortcuts | Post-MVP |

This list prevents agents from gold-plating or adding unrequested features. If a user requests a post-MVP feature, log it as a feedback entry and inform the human rather than implementing it.

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

All agents must read the relevant steering documents before starting work. These documents are maintained across sessions and contain the authoritative project state.

| Document | Path | Purpose |
|---|---|---|
| Requirements | `requirements/requirements.md` | Full feature spec with requirement IDs (C-xx, A-xx, K-xx, P-xx, E-xx) |
| Requirements (rendered) | `requirements/requirements.html` | HTML view — kept in sync with requirements.md |
| Development Method | `devmethod/devmethod.md` | Agent roles, workflow, delivery sequence, MVP agent ordering |
| Development Method (rendered) | `devmethod/devmethod.html` | HTML view — kept in sync with devmethod.md |
| Resources | `resources/resources.md` | Reference projects, learning materials, API docs |
| Resources (rendered) | `resources/resources.html` | HTML view — kept in sync with resources.md |
| Type Contracts | `src/types/index.ts` | Shared TypeScript interfaces — **source of truth for all agents** |
| Agent Specs | `agentspecs/00-scaffolder.md` … `07-requirements-agent.md` | Per-agent task specifications with grouped implementation steps |
| ADR Index | `decisions/README.md` | Architecture Decision Records — do not contradict `accepted` ADRs |
| Lessons | `LESSONS.md` | Running log of improvements and patterns from the Improvement Agent |

**Paired document rule (see Section 12):** `requirements.md ↔ requirements.html` · `devmethod.md ↔ devmethod.html` · `resources.md ↔ resources.html` — always updated together in the same commit.

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

*CLAUDE.md v1.0 — Scaffold complete: all sections populated with real project configuration — March 2026*
