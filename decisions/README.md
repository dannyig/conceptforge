# Architecture Decision Records (ADRs)

This folder records significant architectural and tooling decisions made during the ConceptForge project.
ADRs explain *why* a decision was made — not just what was decided.

Agents and humans must consult this folder before changing any decision marked `accepted`.
To reverse or supersede a decision, raise a feedback entry first, then create a new ADR.

## Format

Files named: `ADR-NNN-<short-title>.md`
Example: `ADR-001-react-flow-for-canvas.md`

## Status Values

- `proposed` — under consideration
- `accepted` — in effect, do not change without a new ADR
- `superseded` — replaced by a later ADR (link to replacement)
- `rejected` — considered and not adopted (kept for record)

## Index

| ADR | Title | Status |
|---|---|---|
| ADR-001 | React Flow as canvas library | accepted |
| ADR-002 | No backend — browser-only architecture | accepted |
| ADR-003 | User-supplied Claude API key via localStorage | accepted |
| ADR-004 | pnpm as package manager | accepted |
| ADR-005 | Inline styles for dark theme — no CSS framework | accepted |
| ADR-006 | fly.io for deployment via nginx Docker container | accepted |
