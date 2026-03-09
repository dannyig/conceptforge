# /feedback

You are helping log a feedback entry for the ConceptForge project.

## Instructions

1. Ask the user (or infer from context) what the issue or observation is
2. Determine the correct category from: `tooling`, `types`, `claude-md`, `agentspec`, `structure`, `ci-cd`, `testing`, `react-flow`, `ai-layer`, `process`, `other`
3. Determine severity: `low`, `medium`, or `high`
4. Create a new file in `feedback/` named: `YYYY-MM-DD-<short-title>.md`
5. Use the structure from `feedback/TEMPLATE.md`
6. Set `Status: open`
7. Commit the file to the current working branch with message: `docs: add feedback entry — <short-title>`

## Do not

- Create a new branch for feedback entries — commit to the current branch
- Leave any template placeholder text in the file
- Mark the entry as anything other than `open`
