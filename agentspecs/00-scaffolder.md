# Agent Spec: Scaffolder

**Agent:** Scaffolder
**Sequence:** 00 — runs first, only once
**Trigger:** `/scaffold` slash command
**Branch:** `chore/scaffold-project-setup`
**Blocks:** All other agents — nothing starts until this is complete

---

## Mission

Set up the complete ConceptForge project so every subsequent agent can start work immediately without making any structural decisions. When the Scaffolder is done, the repo must be runnable locally, all tooling must be operational, CI/CD must be wired, and CLAUDE.md must be fully populated.

---

## Input Documents

Read these in full before taking any action:

| Document | Path | Why |
|---|---|---|
| Requirements | `requirements/requirements.md` | Understand what is being built |
| Dev Method | `devmethod/devmethod.md` | Understand agent roles and delivery sequence |
| Resources | `resources/resources.md` | Reference stack decisions and similar projects |
| This spec | `agentspecs/00-scaffolder.md` | Your task list |

---

## Deliverables

Complete all items below in order. Commit after each group.

---

### Group 1 — Package & Toolchain

- [ ] Initialise `package.json` with `pnpm` as package manager
- [ ] Install runtime dependencies:
  - `react`, `react-dom`
  - `@xyflow/react` (React Flow v12+)
- [ ] Install dev dependencies:
  - `vite`, `@vitejs/plugin-react`
  - `typescript`
  - `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`
  - `prettier`, `eslint-config-prettier`
  - `husky`, `lint-staged`
  - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
  - `@playwright/test`
- [ ] Create `tsconfig.json` with strict mode enabled
- [ ] Create `vite.config.ts` with React plugin and path alias `@/ → src/`
- [ ] Create `.eslintrc.json` enforcing: no `any`, TypeScript strict, import order
- [ ] Create `.prettierrc` with project formatting rules
- [ ] Configure `husky` pre-commit hook: runs `pnpm lint-staged`
- [ ] Configure `lint-staged` to run ESLint + Prettier on staged files
- [ ] Create `.gitignore` covering: `node_modules/`, `dist/`, `.env`, `*.local`

**Commit:** `chore: initialise package, toolchain and lint config`

---

### Group 2 — Project Structure

Create the following empty folders and index files:

```
src/
  components/
    canvas/          # React Flow canvas, custom nodes, edges
    ai/              # Prompt input panel, expansion UI, loading states
    toolbar/         # Top bar — save, load, export, settings trigger
    settings/        # API key input panel
  hooks/             # Custom React hooks
  lib/
    claude.ts        # Claude API client — stub only
    graph.ts         # Node/edge helpers, layout utilities — stub only
    export.ts        # JSON save/load, PNG export — stub only
  types/
    index.ts         # All shared TypeScript interfaces — populate in Group 3
  App.tsx            # Root component — stub only
  main.tsx           # React entry point
tests/
  unit/              # Vitest tests — empty, structure only
  e2e/               # Playwright tests — empty, structure only
```

- [ ] Create all folders and stub files above
- [ ] Create `index.html` with dark background and `<div id="root">`
- [ ] Create `src/main.tsx` mounting `<App />` inside `<StrictMode>`
- [ ] Create `src/App.tsx` rendering a placeholder `<div>ConceptForge</div>`
- [ ] Verify `pnpm dev` runs without errors before committing

**Commit:** `chore: create project folder structure and stub files`

---

### Group 3 — Shared Type Contracts

Populate `src/types/index.ts` with all shared interfaces. These are the contracts every agent programs to — do not change them without updating CLAUDE.md section 5.

```typescript
export interface ConceptNode {
  id: string
  label: string
  position: { x: number; y: number }
  type?: 'concept' | 'question' | 'source' | 'insight'
}

export interface ConceptEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface MapData {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
}

export interface ClaudeMapResponse {
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ source: string; target: string; label?: string }>
}

export interface ExpandNodeRequest {
  nodeId: string
  nodeLabel: string
  existingNodes: ConceptNode[]
}
```

- [ ] Write all interfaces above into `src/types/index.ts`
- [ ] Run `pnpm typecheck` — must pass with zero errors

**Commit:** `chore: define shared TypeScript type contracts`

---

### Group 4 — CI/CD Pipeline

- [ ] Create `.github/workflows/ci.yml`:
  - Trigger: push to any branch, PR to main
  - Steps: checkout → pnpm install → lint → typecheck → vitest → playwright
- [ ] Create `.github/workflows/deploy.yml`:
  - Trigger: push to main only (after CI passes)
  - Steps: checkout → fly deploy
  - Requires: `FLY_API_TOKEN` secret in GitHub repo settings
- [ ] Create `Dockerfile` — multi-stage: Node build → nginx serve on port 8080
- [ ] Create `nginx.conf` — serves `dist/` with SPA fallback to `index.html`
- [ ] Confirm `fly.toml` exists and references app name `conceptforge`

**Commit:** `chore: add GitHub Actions CI/CD and Docker deployment config`

---

### Group 5 — Populate CLAUDE.md

Fill in every section of `CLAUDE.md` that currently contains `_To be completed by the Scaffolder agent._`

Replace each placeholder with real content:

| Section | What to write |
|---|---|
| 1. Project Overview | One paragraph — what ConceptForge is, stack, no-backend constraint, fly.io deployment |
| 2. Development Commands | Exact `pnpm` scripts from package.json with one-line descriptions |
| 3. Project Structure | Annotated directory tree matching Group 2 output |
| 4. Architecture | Component model, state strategy, canvas layer, AI layer, data flow |
| 5. TypeScript Contracts | Rules + full interface listing from Group 3 |
| 6. Code Style Standards | All rules from this spec plus ESLint/Prettier config decisions |
| 7. Testing | Vitest setup, Playwright setup, file locations, mock strategy for Claude API |
| 8. Git Conventions | Branch naming, Conventional Commits, CI gate |
| 9. Agent Roles | Confirmed role list from devmethod.md — add any detail discovered during scaffold |
| 10. Spec-Driven Workflow | Full 10-step cycle referencing agentspecs/ folder |
| 11. Skill Activation | Update with any skills installed during scaffold |
| 12. Critical Rules | UI states, error handling, async guards, API key safety, canvas mutation rules |
| 13. Security | localStorage key handling, no intermediate server, CSP, input sanitisation |
| 14. Deployment | fly deploy instructions, GitHub Actions trigger, URL |
| 15. Known Gaps | Full list from requirements/requirements.md section 7 |
| 16. Steering Documents | Confirm all paths are correct post-scaffold |

- [ ] All 16 sections populated with real content
- [ ] Remove all `_To be completed by the Scaffolder agent._` placeholders
- [ ] Update CLAUDE.md footer version to `v1.0`

**Commit:** `docs: populate CLAUDE.md with full project configuration`

---

### Group 6 — Verification

Before marking this spec complete, verify the following:

- [ ] `pnpm dev` — dev server starts, browser shows ConceptForge placeholder
- [ ] `pnpm build` — production build completes, `dist/` folder created
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm typecheck` — zero TypeScript errors
- [ ] `pnpm test` — Vitest runs (zero tests is acceptable at this stage)
- [ ] `pnpm test:e2e` — Playwright runs (zero tests is acceptable at this stage)
- [ ] All files committed, branch pushed, CI green on GitHub
- [ ] Merge `chore/scaffold-project-setup` to `main`

---

## Output Checklist

When done, the following must exist in the repo:

```
conceptforge/
├── .claude/
│   └── commands/
│       └── scaffold.md          ✓ exists (this slash command)
├── .github/
│   └── workflows/
│       ├── ci.yml               ✓ exists and valid
│       └── deploy.yml           ✓ exists and valid
├── agentspecs/
│   └── 00-scaffolder.md         ✓ this file
├── devmethod/                   ✓ already exists
├── requirements/                ✓ already exists
├── resources/                   ✓ already exists
├── src/
│   ├── components/canvas/       ✓ exists
│   ├── components/ai/           ✓ exists
│   ├── components/toolbar/      ✓ exists
│   ├── components/settings/     ✓ exists
│   ├── hooks/                   ✓ exists
│   ├── lib/claude.ts            ✓ stub exists
│   ├── lib/graph.ts             ✓ stub exists
│   ├── lib/export.ts            ✓ stub exists
│   ├── types/index.ts           ✓ fully populated
│   ├── App.tsx                  ✓ exists
│   └── main.tsx                 ✓ exists
├── tests/unit/                  ✓ exists
├── tests/e2e/                   ✓ exists
├── .eslintrc.json               ✓ exists
├── .gitignore                   ✓ exists
├── .prettierrc                  ✓ exists
├── CLAUDE.md                    ✓ fully populated, v1.0
├── Dockerfile                   ✓ exists
├── fly.toml                     ✓ exists
├── index.html                   ✓ exists
├── nginx.conf                   ✓ exists
├── package.json                 ✓ all dependencies listed
├── tsconfig.json                ✓ strict mode
└── vite.config.ts               ✓ exists with path alias
```

---

## Handoff

When all groups are complete and merged to main, the following agents are unblocked and can start in parallel:

- **Canvas Agent** → reads `agentspecs/01-canvas-agent.md`
- **Settings Agent** → reads `agentspecs/02-settings-agent.md`

Post their completion, the following unblock:

- **AI Agent** → reads `agentspecs/03-ai-agent.md`
- **Persistence Agent** → reads `agentspecs/04-persistence-agent.md`

Finally:

- **QA Agent** → reads `agentspecs/05-qa-agent.md`

---

*Scaffolder Agent Spec v1.0 — March 2026*
