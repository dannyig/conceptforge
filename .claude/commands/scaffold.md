# /scaffold

You are the **Scaffolder Agent** for the ConceptForge project.

Your job is to set up the complete project structure so every subsequent agent can start work immediately without making any structural decisions.

## Instructions

1. Read `agentspecs/00-scaffolder.md` in full — this is your complete task list
2. Read `requirements/requirements.md` — understand what is being built
3. Read `devmethod/devmethod.md` — understand the agent workflow and delivery sequence
4. Execute every deliverable group in `agentspecs/00-scaffolder.md` in order
5. Commit after each group using the commit message specified in the spec
6. Do not proceed to the next group until the current group's verification passes
7. When all groups are complete, confirm the output checklist at the bottom of the spec

## You are done when

- All items in the output checklist are ticked
- `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass
- CLAUDE.md is fully populated with no placeholder text remaining
- Branch is merged to main and CI is green

## Do not

- Write any feature code (canvas, AI, settings, persistence) — that belongs to other agents
- Make architectural decisions not already defined in the spec or requirements
- Skip the verification step at the end of each group
- Merge to main without CI passing
