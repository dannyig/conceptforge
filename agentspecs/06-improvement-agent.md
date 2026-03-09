# Agent Spec: Improvement Agent

**Agent:** Improvement Agent
**Sequence:** 06 — runs on demand, after any agent completes or when feedback accumulates
**Trigger:** `/improve` slash command
**Branch:** `chore/process-improvement-<YYYY-MM-DD>`

---

## Mission

Read all open feedback entries and ADRs, identify patterns and recurring issues, then implement targeted improvements to the development process, tooling, and agent instructions. The Improvement Agent does not write feature code — it improves the system that agents use to write feature code.

---

## Input Documents

Read these before taking any action:

| Document | Path | Why |
|---|---|---|
| All open feedback entries | `feedback/*.md` (status: open) | Source of issues to act on |
| ADR index | `decisions/README.md` | Understand current accepted decisions |
| Agent instructions | `CLAUDE.md` | Current state of agent instructions |
| All agent specs | `agentspecs/*.md` | Current state of task specs |
| Dev method | `devmethod/devmethod.md` | Current workflow definition |
| Tooling config | `.eslintrc.json`, `tsconfig.json`, `.prettierrc` | Current tooling state |

---

## Process

### Step 1 — Triage Open Feedback

Read every feedback file with `Status: open`.
Group entries by category:

```
tooling, types, claude-md, agentspec, structure, ci-cd, testing, react-flow, ai-layer, process
```

Within each group, identify:
- **Single issues** — one-off problems with a clear fix
- **Patterns** — the same category appearing 2+ times, indicating a systemic gap

Prioritise: `high` severity first, then patterns over single issues.

---

### Step 2 — Implement Fixes

For each group with open feedback, apply the appropriate fix:

| Category | Where to make the change |
|---|---|
| `tooling` | `.eslintrc.json`, `tsconfig.json`, `.prettierrc`, `package.json` scripts |
| `types` | `src/types/index.ts` + update CLAUDE.md section 5 |
| `claude-md` | `CLAUDE.md` — the specific section that was unclear or missing |
| `agentspec` | The relevant `agentspecs/NN-<agent>.md` file |
| `structure` | Move/rename files, update CLAUDE.md section 3 to match |
| `ci-cd` | `.github/workflows/ci.yml` or `deploy.yml` |
| `testing` | `vitest.config.ts`, `playwright.config.ts`, test helper files |
| `react-flow` | CLAUDE.md section 4 (Architecture) or section 12 (Critical Rules) |
| `ai-layer` | `src/lib/claude.ts` patterns, CLAUDE.md section 4 |
| `process` | CLAUDE.md section 8 (Git Conventions) or section 10 (Spec-Driven Workflow) |

**Rules for making changes:**
- Do not change anything marked `accepted` in an ADR without first creating a new ADR superseding it
- Do not change shared type contracts (`src/types/index.ts`) without notifying in the commit message which agents are affected
- Do not remove CLAUDE.md sections — only add or clarify
- Verify `pnpm lint && pnpm typecheck && pnpm test` passes after every change

---

### Step 3 — Create ADR (if applicable)

If a fix represents a significant architectural or tooling decision, create a new ADR:

```
decisions/ADR-NNN-<short-title>.md
```

Update `decisions/README.md` index.

Triggers for a new ADR:
- Changing a library or framework dependency
- Changing the TypeScript strict mode settings
- Adding a new tooling layer (e.g. adding Zod for validation)
- Reversing a previous ADR decision
- Adding a new agent role

---

### Step 4 — Update LESSONS.md

Append a dated entry to `LESSONS.md` summarising:
- What feedback was processed
- What was changed
- What pattern was identified (if any)
- What to watch for in future agent sessions

---

### Step 5 — Mark Feedback Resolved

Update each processed feedback entry:
- Set `Status: resolved`
- Add a line: `Resolved in commit: <commit-hash>`

---

### Step 6 — Commit & Push

```
chore: process improvement — <YYYY-MM-DD>

- Fixed: <brief list of what was changed>
- ADRs created: <if any>
- Feedback resolved: <count> entries
```

Merge to `main` — CI must pass.

---

## What the Improvement Agent Must NOT Do

- Write or modify feature code in `src/components/`, `src/hooks/`, or `src/lib/`
- Change requirement IDs or requirement descriptions in `requirements/requirements.md`
- Delete feedback entries — only mark them `resolved`
- Override an `accepted` ADR without creating a superseding one
- Make changes not traceable to at least one feedback entry

---

## Cadence

The Improvement Agent should be triggered:
- After each feature agent completes and merges to main
- When 3 or more open feedback entries accumulate
- Before starting a new agent (to ensure instructions are current)
- Explicitly by the human at any time via `/improve`

---

*Improvement Agent Spec v1.0 — March 2026*
