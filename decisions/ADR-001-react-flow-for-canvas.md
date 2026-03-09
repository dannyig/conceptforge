# ADR-001 — React Flow as Canvas Library

**Status:** accepted
**Date:** March 2026
**Raised by:** Human (project design phase)

---

## Context

ConceptForge requires an interactive node-edge canvas where users can create, connect, and manipulate concept nodes. Several options were evaluated.

## Options Considered

| Library | Pros | Cons |
|---|---|---|
| **React Flow (@xyflow/react)** | Purpose-built for node graphs, React-native, excellent docs, active community, used by n8n, Flowise, Dify | Requires React |
| D3.js | Maximum flexibility, widely known | Not React-native, significant boilerplate for node interactions |
| Cytoscape.js | Mature, graph algorithms built-in | Not React-native, heavier, less interactive UI focus |
| Custom SVG/Canvas | Full control | Extreme development cost for MVP |

## Decision

Use **React Flow v12+ (`@xyflow/react`)** as the canvas library.

## Rationale

- Built specifically for interactive node-edge graphs — the exact use case
- React-native — integrates cleanly with the component model
- Used by production AI workflow tools (n8n, Flowise, Dify) confirming fitness for this use case
- Provides pan, zoom, minimap, custom nodes, and edge types out of the box
- Actively maintained with strong documentation

## Consequences

- Canvas state management follows React Flow's `useNodesState` / `useEdgesState` pattern
- All node and edge mutations must go through `setNodes` / `setEdges` — never direct mutation
- React Flow's node/edge types must be mapped to ConceptForge's `ConceptNode` / `ConceptEdge` interfaces
