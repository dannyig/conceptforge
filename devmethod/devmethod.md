# ConceptForge — Development Method

## 1. Overview

ConceptForge is developed exclusively by AI agents using Claude Code. No human writes implementation code. The human role is limited to oversight, review, and direction — agents handle all scaffolding, feature development, testing, and deployment.

---

## 2. Development Philosophy

| Principle | Application |
|---|---|
| **Agents over humans** | All code is written by Claude Code agents |
| **Clarity over cleverness** | Simple, predictable structure agents can navigate without ambiguity |
| **Types as contracts** | TypeScript interfaces defined first — agents program to the contract |
| **Automation as quality gate** | Lint, type-check, and tests must pass before any merge |
| **Requirements-driven** | Every branch maps to a requirement ID — no free-form development |
| **Deployable at all times** | `main` is always in a working, deployed state |

---

## 3. Agent Roles

| Agent | Responsibilities | Requirement IDs |
|---|---|---|
| **Scaffolder** | Project setup, toolchain, CLAUDE.md, shared types, CI/CD pipeline | — |
| **Canvas Agent** | React Flow canvas, node/edge CRUD, pan, zoom, minimap | C-01 → C-07 |
| **AI Agent** | Claude API integration, map generation, node expansion | A-01 → A-09 |
| **Settings Agent** | API key input, localStorage storage, validation | K-01 → K-04 |
| **Persistence Agent** | JSON save/load, PNG export | P-01 → E-02 |
| **QA Agent** | Vitest unit tests, Playwright E2E tests across all features | All |

Each agent is self-contained. Agents coordinate through shared TypeScript types and CLAUDE.md — not through direct communication.

---

## 4. Agent Workflow

Each agent follows this sequence for every task:

```
1. Read CLAUDE.md — conventions, stack, constraints
2. Read the relevant requirement ID from requirements/requirements.md
3. Review shared types in src/types/index.ts
4. Create a feature branch:  feature/<req-id>-<short-description>
5. Write implementation + tests
6. Run: pnpm lint && pnpm test
7. Fix all failures before committing
8. Commit with message referencing the requirement ID
9. Push branch → CI runs automatically
10. On CI green → merge to main → auto-deploys to fly.io
```

---

## 5. Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Always deployable — protected, CI required to merge |
| `feature/<req-id>-<desc>` | One branch per requirement ID |
| `fix/<short-desc>` | Bug fixes found during QA |
| `chore/<short-desc>` | Tooling, config, dependency updates |

**Examples:**
```
feature/C-01-react-flow-canvas
feature/A-02-map-generation
feature/K-01-api-key-settings
fix/node-duplicate-on-expand
```

---

## 6. Toolchain

| Layer | Tool | Version |
|---|---|---|
| Language | TypeScript (strict mode) | 5.x |
| Framework | React | 18.x |
| Build | Vite | 5.x |
| Package manager | pnpm | latest |
| Graph canvas | React Flow | 11.x |
| Linting | ESLint + Prettier | — |
| Pre-commit hooks | Husky + lint-staged | — |
| Unit tests | Vitest | — |
| E2E tests | Playwright | — |
| CI/CD | GitHub Actions | — |
| Deployment | fly.io (nginx container) | — |

---

## 7. Project Structure

```
conceptforge/
├── .github/
│   └── workflows/
│       ├── ci.yml             # lint + test on every push
│       └── deploy.yml         # deploy to fly.io on merge to main
├── devmethod/                 # this folder — development strategy docs
├── requirements/              # requirements definition (MD + HTML)
├── src/
│   ├── components/
│   │   ├── canvas/            # React Flow canvas, custom nodes
│   │   ├── ai/                # prompt panel, expansion UI
│   │   ├── toolbar/           # top bar actions (save, load, export)
│   │   └── settings/          # API key management panel
│   ├── hooks/                 # custom React hooks
│   ├── lib/
│   │   ├── claude.ts          # Claude API client + prompt templates
│   │   ├── graph.ts           # node/edge helpers, layout logic
│   │   └── export.ts          # JSON save/load, PNG export
│   ├── types/
│   │   └── index.ts           # shared TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/                  # Vitest unit tests
│   └── e2e/                   # Playwright E2E tests
├── CLAUDE.md                  # agent instructions and conventions
├── Dockerfile
├── fly.toml
├── nginx.conf
└── package.json
```

---

## 8. Quality Gates

No code reaches `main` without passing all three gates:

| Gate | Tool | Runs |
|---|---|---|
| Code style | ESLint + Prettier | Pre-commit (Husky) + CI |
| Type safety | `tsc --noEmit` | CI |
| Tests | Vitest + Playwright | CI |

CI is configured in `.github/workflows/ci.yml`. Merging to `main` without green CI is blocked at the GitHub branch protection level.

---

## 9. Shared Type Contracts

Types are defined before any implementation begins. All agents program to these contracts.

```typescript
// src/types/index.ts

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
```

---

## 10. CLAUDE.md — Agent Instructions

Every agent reads `CLAUDE.md` at the start of each session. It contains:
- Stack and toolchain summary
- File and folder conventions
- Coding standards (no `any`, functional components only, inline styles)
- Pre-commit checklist (`pnpm lint && pnpm test`)
- Branch naming rules
- AI output contract reference

---

## 11. Human Oversight

The human role in this workflow:

| Activity | Frequency |
|---|---|
| Review deployed app on fly.io | After each feature merge |
| Review GitHub PR / commit diffs | Optional — CI is the primary gate |
| Direct agents to next requirement | At the start of each session |
| Update CLAUDE.md with new conventions | As patterns emerge |
| Approve post-MVP features | After MVP is stable |

---

## 12. Deployment Pipeline

```
push to feature branch
       │
       ▼
GitHub Actions CI
  ├── pnpm install
  ├── pnpm lint
  ├── pnpm type-check
  └── pnpm test
       │
    CI green?
       │
       ▼
  merge to main
       │
       ▼
GitHub Actions Deploy
  └── fly deploy → https://conceptforge.fly.dev
```

---

## 13. MVP Delivery Sequence

Agents are tasked in this order to manage dependencies:

```
1. Scaffolder      → project setup, types, CLAUDE.md, CI/CD
2. Canvas Agent    → core canvas (depends on: project scaffold)
3. Settings Agent  → API key panel (depends on: project scaffold)
4. AI Agent        → map generation + expansion (depends on: canvas + settings)
5. Persistence Agent → save/load/export (depends on: canvas)
6. QA Agent        → tests across all features (depends on: all above)
```

---

*Version 1.0 — March 2026*
