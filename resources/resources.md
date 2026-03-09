# ConceptForge — Development Resources

Curated reference projects, tools, and reading material for Claude Code-driven frontend development. Organised by category with relevance notes specific to ConceptForge.

---

## 1. Architecturally Closest Projects

Projects that share ConceptForge's stack or pattern: React + React Flow + AI API + no backend.

### [shrimbly/node-banana](https://github.com/shrimbly/node-banana)
**Closest architectural twin.**
Free, open-source, node-based generative AI workflow editor built with Next.js + TypeScript + `@xyflow/react` (React Flow). Users drag nodes onto an infinite canvas and connect them via typed handles. BYOK (bring your own API key) model. Has a `CLAUDE.md` — built with Claude Code assistance. MIT licence.

- React Flow canvas + AI API calls + BYOK key model
- Study its node type system, handle typing, and canvas interaction patterns

### [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise)
**Gold standard for React Flow + AI canvas UI.**
Most prominent open-source AI workflow builder using React Flow drag-and-drop canvas. 35k+ stars. React frontend + Node backend. Study the node component architecture, edge types, and canvas interaction patterns.

### [langgenius/dify](https://github.com/langgenius/dify)
**Large-scale React + TypeScript + React Flow canvas.**
Production-grade agentic workflow builder. Large open-source project. Good reference for how a mature team structures complex canvas-based AI apps.

### [claudio-silva/claude-artifact-runner](https://github.com/claudio-silva/claude-artifact-runner)
**Exact stack match — Vite + React + TypeScript + no backend.**
Template that mirrors Claude's Artifact execution environment. Deploys to Vercel or Cloudflare Pages. Minimal, clean starting point. `npx run-claude-artifact` to bootstrap.

### [xyflow/xyflow](https://github.com/xyflow/xyflow)
**React Flow library itself.**
Essential reference. The [Showcase page](https://reactflow.dev/showcase) lists real-world apps. The [Pro Examples](https://reactflow.dev/pro/examples) include workflow builders and canvas apps directly applicable to ConceptForge.

---

## 2. Claude Code Workflow & Dev Method

Resources for structuring agent-driven development with Claude Code.

### [Pimzino/claude-code-spec-workflow](https://github.com/Pimzino/claude-code-spec-workflow)
**Slash commands for spec-driven development.**
Automated workflows: Requirements → Design → Tasks → Implementation and Bug Fix → Analyze → Fix → Verify. Directly applicable to ConceptForge's devmethod and requirement ID structure.

### [github/spec-kit](https://github.com/github/spec-kit)
**GitHub's official spec-driven toolkit for Claude Code.**
Produces structured spec artifacts (requirements, design, tasks) that guide Claude Code agents. Integrates with CLAUDE.md workflows.

### [ChrisWiles/claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase)
**Comprehensive Claude Code project configuration example.**
Covers hooks, skills, custom agents, slash commands, and GitHub Actions workflows. Stack includes React + TypeScript. Good reference for CLAUDE.md structure and CI setup.

### [senaiverse/claude-code-reactnative-expo-agent-system](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system)
**Multi-agent frontend development patterns.**
7 production sub-agents for React apps: accessibility, design systems, security, performance, testing. Built for Claude Code v2.0.5+. Reference for defining specialised agent roles.

---

## 3. Official Anthropic Resources

### [frontend-design Claude Code Plugin](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)
**Install this before starting UI development.**
Official skill that guides Claude toward distinctive typography, bold colour palettes, and high-impact design. Directly prevents generic "AI slop" aesthetics. Essential for ConceptForge's dark theme UI.

Install:
```bash
claude code skills install frontend-design
```

### [Improving Frontend Design Through Skills — Anthropic Blog](https://claude.com/blog/improving-frontend-design-through-skills)
Official blog post introducing the frontend-design skill. Shows dramatic before/after UI examples.

### [Anthropic Cookbook — Prompting for Frontend Aesthetics](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics)
Official guide for prompting Claude to produce quality frontend UI output. Read before writing UI-related agent prompts.

### [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
Official docs for installing and creating Claude Code skills.

### [Claude Code Product Page](https://claude.com/product/claude-code)
Stay current on capabilities, pricing, and the agent model.

---

## 4. Blog Posts & Case Studies

### [Building React Applications with Claude Code — ancuta.org](https://ancuta.org/posts/ai-building-react-frontend-with-claude-code/)
Production-tested patterns: standardising specs for Claude to parse, Figma component links, prompt engineering for consistent output. Practical and grounded.

### [Claude Code for React & React Native — Cars24 Engineering](https://medium.com/cars24/claude-code-for-react-react-native-workflows-that-actually-move-the-needle-33b8bb410b14)
A production team's real workflow for React development with Claude Code. Covers patterns that save meaningful time vs. patterns that don't. Feb 2026.

### [Spec-Driven Development with Claude Code in Action — alexop.dev](https://alexop.dev/posts/spec-driven-development-claude-code-in-action/)
Practical walkthrough using separate `SPEC_frontend.md` and `SPEC_backend.md` files per domain. Directly applicable to ConceptForge's requirements folder structure.

### [GitHub Spec-Kit with Claude Code — rajeevpentyala.com](https://rajeevpentyala.com/2026/02/22/github-spec-kit-with-claude-code-build-a-react-app-using-spec-driven-ai/)
Builds a Vite + React + TypeScript app using GitHub's spec-kit with auto-generated unit tests. Feb 2026.

### [Building Faster with V0 and Claude Code — Strapi](https://strapi.io/blog/building-faster-with-v0-and-claude-code-lessons-learned-from-vibe-coding)
Combining Vercel v0 (UI scaffolding) with Claude Code (agent-driven implementation). Covers the agentic loop workflow increasingly common for frontend apps.

### [How to Build React Apps with Claude Code — Apidog](https://apidog.com/blog/build-react-apps-with-claude-code/)
Fundamentals, hands-on implementation, and optimisation techniques. Good entry-level reference.

### [How to Use Claude to Build a Web App — LogRocket](https://blog.logrocket.com/claude-web-app/)
Demonstrates migrating a project from Create React App to Vite with Claude Code handling the refactor. Useful precedent since ConceptForge is Vite-based.

### [Building a Full-Stack React App with Claude — anishgandhi.com](https://anishgandhi.com/how-i-used-claude-code-to-build-a-full-stack-react-app-a-step-by-step-development-guide)
Step-by-step guide. Evolved from prototype to 252 tests. Covers security hardening and documentation practices.

---

## 5. Community & Discovery

### [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
**Primary curated index of the Claude Code ecosystem.** 21,000+ stars. Covers skills, hooks, slash commands, agent orchestrators, applications, and plugins. Start here for any Claude Code discovery.

### [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)
Curated list of Claude Skills for customising Claude Code workflows. Good for finding reusable frontend skills.

### [Anthropic Discord](https://discord.com/invite/6PPFFzqPDZ)
Official Discord. 66,000+ members. Primary real-time community for Claude Code questions, patterns, and troubleshooting.

### [awesomeclaude.ai](https://awesomeclaude.ai)
Browsable community directory of Claude AI resources and tools.

### [claudelog.com](https://claudelog.com/claude-code-mcps/awesome-claude-code/)
Tracks Claude Code tools, MCP servers, and resources. Updated frequently.

---

## 6. Priority Actions Before Development Starts

| Priority | Action | Resource |
|---|---|---|
| 1 | Study node-banana repo structure, CLAUDE.md, and node type patterns | [shrimbly/node-banana](https://github.com/shrimbly/node-banana) |
| 2 | Install the frontend-design Claude Code skill | [Anthropic plugin](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design) |
| 3 | Read spec-workflow slash commands — integrate into devmethod | [Pimzino/claude-code-spec-workflow](https://github.com/Pimzino/claude-code-spec-workflow) |
| 4 | Read the Anthropic frontend aesthetics cookbook entry | [Cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics) |
| 5 | Browse awesome-claude-code for any new relevant skills or tools | [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) |

---

*Version 1.0 — March 2026*
