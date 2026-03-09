# Feedback Log

This folder captures issues, friction points, and improvement observations raised during development.
Entries are raised by agents or humans as they happen and are processed by the Improvement Agent.

## How to Raise Feedback

1. Copy `TEMPLATE.md` to a new file: `YYYY-MM-DD-<short-title>.md`
2. Fill in all fields
3. Commit to the current working branch — do not create a separate branch for feedback entries
4. Or run `/feedback` in Claude Code to have an agent create the entry for you

## How Feedback is Processed

The Improvement Agent (`/improve`) reads all `open` entries, groups them by category,
identifies patterns, and implements fixes across CLAUDE.md, agentspecs, and tooling.
Processed entries are updated to `resolved` with a reference to the implementing commit.

## Categories at a Glance

| Category | Examples |
|---|---|
| `tooling` | ESLint rule too strict/lenient, Prettier conflict, pnpm script missing |
| `types` | Interface missing a field, type too narrow, contract mismatch |
| `claude-md` | Agent misunderstood an instruction, section was missing |
| `agentspec` | Task spec was ambiguous, missing a step, wrong sequence |
| `structure` | Agent created file in wrong folder, naming inconsistency |
| `ci-cd` | GitHub Actions failure, Docker build issue, fly deploy problem |
| `testing` | Test setup broke, mock strategy unclear, flaky E2E test |
| `react-flow` | Unexpected canvas behaviour, undocumented library quirk |
| `ai-layer` | Claude API returned unexpected shape, prompt produced wrong output |
| `process` | Branch naming confusion, commit convention unclear |
| `other` | Anything not covered by the categories above |
