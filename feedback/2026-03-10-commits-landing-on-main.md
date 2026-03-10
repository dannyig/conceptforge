# Feedback Entry

## Date
2026-03-10

## Raised By
Settings Agent (Claude Code)

## Category
process

## Severity
high

## Description
During the Settings Agent session, two feature commits (`feat(K-01,K-02,K-04)` and `feat(K-03)`) were made directly to the `main` branch instead of the `feature/K-01-api-key-settings` branch. The `git checkout -b feature/K-01-api-key-settings` command was run but the agent did not verify the active branch before committing. Git's commit output shows `[main ...]` as the branch name when this happens, which is a detectable signal that was missed.

## Impact
- Settings Agent changes bypassed the PR review process entirely
- Code was pushed directly to `main` and deployed without a PR
- The feature branch PR showed no diff, making the change untrackable
- Branch protection on `main` did not prevent this because commits were made locally then pushed (or the branch was not protected against direct push)

## Suggested Fix
Add a mandatory `git branch --show-current` verification step to CLAUDE.md Section 10 (Spec-Driven Workflow) immediately before committing. If the output is `main`, the agent must stop, switch to the correct feature branch, and re-stage the changes. Also add this check to each agent spec's commit step. The Improvement Agent should add an explicit rule: "Never commit when `git branch --show-current` returns `main`."

## Status
open

---
