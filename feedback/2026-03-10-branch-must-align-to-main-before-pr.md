# Feedback Entry

## Date
2026-03-10

## Raised By
Human

## Category
process

## Severity
high

## Description
The git workflow does not enforce that a feature, fix, or chore branch is aligned with `main` before a PR is raised. Agents and contributors have been raising PRs — or merging — while their branch is behind `main`, resulting in stale diffs, missed conflicts, and branches showing "X commits behind main" on GitHub.

## Impact
- PRs raised from outdated branches show incomplete diffs or hide merge conflicts
- Code that passes CI on the feature branch may fail after merge due to drift from `main`
- Reviewers cannot trust that the PR reflects the current state of the codebase
- The Settings Agent PR showed "3 commits behind main" when raised, requiring a manual re-sync

## Suggested Fix
Add a mandatory pre-PR alignment step to CLAUDE.md Section 10 (Spec-Driven Workflow) between the "fix all failures" step and the "commit" step:

```
git fetch origin main
git merge origin/main --no-edit
# Resolve any conflicts, then re-run lint + typecheck + test before committing
```

Also add this requirement to each agent spec's "commit and push" step. The rule should be stated explicitly: **a branch must have zero commits behind `origin/main` before a PR is raised**.

## Status
resolved

Resolved in commit: (see chore/process-improvement-2026-03-11)

---
