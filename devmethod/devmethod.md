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
| **Process improves over time** | Friction, gaps, and errors are logged as feedback and acted on by the Improvement Agent |

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
| **Improvement Agent** | Processes feedback, updates CLAUDE.md/agentspecs/tooling, records ADRs, updates LESSONS.md | — |

Each agent is self-contained. Agents coordinate through shared TypeScript types and CLAUDE.md — not through direct communication.

---

## 4. Agent Workflow

Each agent follows this sequence for every task:

```
1.  Read CLAUDE.md — conventions, stack, constraints
2.  Read the relevant requirement ID from requirements/requirements.md
3.  Review shared types in src/types/index.ts
4.  Create a feature branch:  feature/<req-id>-<short-description>
5.  Write implementation + tests
6.  Log any friction, ambiguity, or issues encountered using /feedback
7.  Run: pnpm lint && pnpm test
8.  Fix all failures before committing
9.  [Frontend agents] Start the dev server (pnpm dev) and use Playwright MCP
    + Chrome to verify the feature in the browser — check visual output,
    interactive behaviour, and browser console errors before committing
10. Commit with message referencing the requirement ID
11. Push branch → CI runs automatically
12. On CI green → merge to main → auto-deploys to fly.io
```

---

## 5. Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Always deployable — protected, CI required to merge |
| `feature/<req-id>-<desc>` | One branch per requirement ID |
| `fix/<short-desc>` | Bug fixes found during QA |
| `chore/<short-desc>` | Tooling, config, dependency updates |
| `chore/process-improvement-<YYYY-MM-DD>` | Improvement Agent changes to process, tooling, or agent instructions |

**Examples:**
```
feature/C-01-react-flow-canvas
feature/A-02-map-generation
feature/K-01-api-key-settings
fix/node-duplicate-on-expand
chore/process-improvement-2026-03-09
```

---

## 6. Toolchain

| Layer | Tool | Version |
|---|---|---|
| Language | TypeScript (strict mode) | 5.x |
| Framework | React | 18.x |
| Build | Vite | 5.x |
| Package manager | pnpm | latest |
| Graph canvas | React Flow (`@xyflow/react`) | 12.x |
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
├── .claude/
│   └── commands/              # slash commands — /scaffold, /improve, /feedback
├── .github/
│   └── workflows/
│       ├── ci.yml             # lint + test on every push
│       └── deploy.yml         # deploy to fly.io on merge to main
├── agentspecs/                # per-agent task specs — read before starting work
│   ├── 00-scaffolder.md
│   ├── 01-canvas-agent.md
│   ├── 02-settings-agent.md
│   ├── 03-ai-agent.md
│   ├── 04-persistence-agent.md
│   ├── 05-qa-agent.md
│   └── 06-improvement-agent.md
├── decisions/                 # Architecture Decision Records (ADRs)
├── devmethod/                 # this folder — development strategy docs
├── feedback/                  # open feedback entries from agents and humans
├── requirements/              # requirements definition (MD + HTML)
├── resources/                 # reference projects and learning materials
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
│   │   └── index.ts           # shared TypeScript interfaces — source of truth
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/                  # Vitest unit tests
│   ├── e2e/                   # Playwright E2E tests
│   └── e2e-test-cases.html    # Human-readable test cases with requirement traceability
├── CLAUDE.md                  # agent instructions and conventions
├── LESSONS.md                 # running log of process improvements
├── Dockerfile
├── fly.toml
├── nginx.conf
└── package.json
```

---

## 8. Quality Gates

No code reaches `main` without passing all four gates:

| Gate | Tool | Runs |
|---|---|---|
| Code style | ESLint + Prettier | Pre-commit (Husky) + CI |
| Type safety | `tsc --noEmit` | CI |
| Tests | Vitest + Playwright | CI |
| UI Verification | Playwright MCP + Chrome | Frontend agents — browser assessment before commit |

The UI Verification gate applies to all frontend feature agents (Canvas, Settings, AI, Persistence). Before committing, the agent starts the dev server and uses the Playwright MCP to navigate the feature in Chrome, confirming correct visual output, interaction behaviour, and a clean browser console.

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
- Branch naming rules and Git conventions
- AI output contract reference
- Agent roles and responsibilities
- Spec-driven workflow steps
- Critical rules (error handling, UI states, async guards, API key safety)
- Security rules
- Feedback and continuous improvement process (section 17)

CLAUDE.md is a living document — the Improvement Agent updates it when feedback identifies gaps or errors.

---

## 11. Human Oversight

The human role in this workflow:

| Activity | Frequency |
|---|---|
| Review deployed app on fly.io | After each feature merge |
| Review GitHub PR / commit diffs | Optional — CI is the primary gate |
| Direct agents to next requirement | At the start of each session |
| Run `/improve` to process accumulated feedback | After each feature agent completes, or when 3+ feedback entries are open |
| Review `LESSONS.md` for emerging patterns | Periodically |
| Review `decisions/` before changing tooling or architecture | Before any structural change |
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
1. Scaffolder         → project setup, types, CLAUDE.md, CI/CD
                         run /improve before proceeding
2. Canvas Agent       → core canvas (depends on: scaffold)
3. Settings Agent     → API key panel (depends on: scaffold) [parallel with Canvas Agent]
                         run /improve before proceeding
4. AI Agent           → map generation + expansion (depends on: canvas + settings)
5. Persistence Agent  → save/load/export (depends on: canvas) [parallel with AI Agent]
                         run /improve before proceeding
6. QA Agent           → tests across all features (depends on: all above)
                         run /improve after QA completes

Improvement Agent runs between each stage — not as a sequential step,
but triggered by /improve whenever feedback accumulates.
```

---

## 14. Feedback & Continuous Improvement

The development process improves through a structured feedback loop running alongside feature development.

### Raising Feedback

Any agent that encounters friction — a missing instruction, ambiguous spec, broken tooling, unexpected library behaviour — logs it immediately using `/feedback`. Feedback is committed to the current working branch, not a separate branch.

### Processing Feedback

The Improvement Agent (`/improve`) reads all open feedback entries, groups them by category, identifies patterns, and implements fixes. In addition to updating CLAUDE.md, agentspecs, tooling, and types, the Improvement Agent also updates `devmethod/devmethod.md` (and its paired `devmethod/devmethod.html`) to reflect any changes to agent roles, workflow steps, or delivery sequence. Changes are committed on a `chore/process-improvement-<date>` branch, merged to main via CI.

### Architecture Decisions

Significant decisions are recorded as ADRs in `decisions/`. No agent may reverse an `accepted` ADR without first creating a superseding one.

### Lessons Learned

`LESSONS.md` accumulates a dated log of what changed and why. It is the institutional memory of the project — read it before starting any new agent session.

### Feedback Loop Diagram

```
Agent encounters issue
        ↓
   /feedback → feedback/YYYY-MM-DD-<title>.md
        ↓
  3+ entries OR feature agent finishes
        ↓
   /improve → Improvement Agent
        ↓
  Fixes:   CLAUDE.md | agentspecs/ | tooling | types | devmethod/
  Records: decisions/ ADR (if needed)
  Updates: LESSONS.md
  Resolves: feedback entries
        ↓
  chore/process-improvement-<date> → CI → main
```

### Paired Document Rule

Where a `.md` file has a corresponding `.html` file, both must be updated in the same commit — never update one without the other. This rule applies to all agents including the Improvement Agent.

| Markdown file | Paired HTML file |
|---|---|
| `devmethod/devmethod.md` | `devmethod/devmethod.html` |
| `requirements/requirements.md` | `requirements/requirements.html` |
| `resources/resources.md` | `resources/resources.html` |

### Key Files

| File/Folder | Purpose |
|---|---|
| `feedback/TEMPLATE.md` | Template for new feedback entries |
| `feedback/README.md` | Category definitions and processing guide |
| `decisions/README.md` | ADR index |
| `LESSONS.md` | Dated log of improvements |
| `agentspecs/06-improvement-agent.md` | Improvement Agent task spec |
| `.claude/commands/improve.md` | `/improve` slash command |
| `.claude/commands/feedback.md` | `/feedback` slash command |

---

*Version 1.3 — March 2026 (added Playwright MCP + Chrome UI Verification gate)*
