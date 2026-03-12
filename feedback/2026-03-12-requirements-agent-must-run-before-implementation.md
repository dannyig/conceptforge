# Feedback Entry

## Date
2026-03-12

## Raised By
Human

## Category
process

## Severity
high

## Description
When the human requests changes that involve new or updated requirements, the same agent has been handling both the requirements update and the implementation in a single conversation. The Requirements Agent role was bypassed entirely — no `/requirements` skill was invoked, no separate `chore/requirements-*` branch was created, and no explicit human approval gate was held between "define the requirement" and "implement it".

## Impact
The requirements-first workflow defined in CLAUDE.md Section 10 and the Requirements Agent's own spec (`agentspecs/07-requirements-agent.md`) was not followed. Requirements and implementation changes were bundled into the same commit/branch, making the history harder to trace and removing the human approval checkpoint.

## Suggested Fix
Any agent that detects a request containing a new requirement or a change to an existing requirement must stop and invoke the Requirements Agent (`/requirements`) before writing any implementation code. The Requirements Agent runs its full Q&A and approval flow on a `chore/requirements-*` branch. Only after that branch is merged does the implementing agent proceed on its own `feature/*` or `fix/*` branch.

Add this as a Critical Rule in CLAUDE.md so all agents are bound by it.

## Status
resolved

Resolved in: chore/process-improvement-2026-03-12

---
