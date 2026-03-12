# ConceptForge — Lessons Learned

A running log of process improvements, patterns identified, and decisions revised.
Updated by the Improvement Agent after each processing cycle.

---

## How to Read This File

Each entry represents one improvement cycle. Most recent entries appear at the top.
Entries reference the feedback files that triggered the change and the commits that implemented it.

---

## Format

```
## YYYY-MM-DD — <short title>

**Feedback processed:** N entries
**Categories:** list of categories

### What changed
- Bullet list of changes made

### Pattern identified (if any)
Description of the recurring issue that triggered systemic change.

### Watch for
What future agents should be alert to as a result of this lesson.
```

---

## 2026-03-12 — Requirements Agent gate: requirements changes must not be bundled with implementation

**Feedback processed:** 1 entry
**Categories:** process

### What changed
- `CLAUDE.md` Section 12: added "Requirements Agent Gate" Critical Rule — any agent detecting a new or changed requirement must invoke `/requirements` before writing any code; requirements docs are owned exclusively by the Requirements Agent
- `agentspecs/01-canvas-agent.md` through `agentspecs/05-qa-agent.md`: added "Requirements gate" warning block to each spec's Deliverables section, immediately before the existing Git protocol block
- `devmethod/devmethod.md` Section 4: added step 0 (Requirements gate) to the agent workflow sequence
- `devmethod/devmethod.html`: mirrored step 0 addition; bumped to v1.8

### Pattern identified
The same agent was handling both requirements updates and implementation in a single conversation. The `/requirements` skill was never invoked; no `chore/requirements-*` branch was created; no human approval gate separated "what to build" from "build it". This is a systemic gap — the workflow docs described step sequencing and branch strategy but did not explicitly block implementation agents from modifying requirements documents.

### Watch for
- Any agent that touches `requirements/requirements.md` or `requirements/requirements.html` outside a `chore/requirements-*` branch is violating this rule
- The correct signal that the gate was bypassed: requirements files appear in the diff of a `feature/*` or `fix/*` branch
- When a human says "update X and implement it" — that is two separate tasks: Requirements Agent first, then implementation agent after the requirements branch merges

---

## 2026-03-11 — Mandatory branch verification and main alignment before PR

**Feedback processed:** 2 entries
**Categories:** process, process

### What changed
- `CLAUDE.md` Section 8: added explicit "Branch verification" and "Pre-PR main alignment" subsections with mandatory shell commands
- `CLAUDE.md` Section 10: added steps 5a (branch verify after checkout), 8a (branch check before commit), 8b (align with main before PR)
- `agentspecs/01-canvas-agent.md`: added git protocol block at start of Deliverables
- `agentspecs/02-settings-agent.md`: added git protocol block at start of Deliverables
- `agentspecs/03-ai-agent.md`: added git protocol block at start of Deliverables
- `agentspecs/04-persistence-agent.md`: added git protocol block at start of Deliverables
- `agentspecs/05-qa-agent.md`: added git protocol block at start of Deliverables
- `devmethod/devmethod.md` Section 4: added steps 4a, 8a, 8b to agent workflow
- `devmethod/devmethod.html`: updated to v1.7 reflecting the same workflow changes

### Pattern identified
Both feedback entries described the same root cause: agents did not check which branch they were on before committing, and did not sync with `main` before raising PRs. This is a systemic gap — the workflow docs described what to commit but not where to verify you are before committing. Two distinct failure modes:
1. Commits landing on `main` directly (Settings Agent: checked out feature branch but committed on `main`)
2. PRs raised from stale branches ("3 commits behind main" on GitHub)

### Watch for
- Every agent must run `git branch --show-current` before the first commit of any session — the output must never be `main`
- Every agent must run `git fetch origin main && git merge origin/main --no-edit` before pushing and raising a PR
- If a commit message in the terminal output shows `[main ...]` — that is the detectable signal that the agent committed to `main`. Stop immediately, create the feature branch, cherry-pick or reset as needed
- PRs that GitHub labels "X commits behind main" should be rejected — always rebase/merge before review
