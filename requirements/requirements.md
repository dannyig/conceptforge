# ConceptForge — Requirements Definition

## 1. Overview

**ConceptForge** is a personal, AI-assisted concept map creation web application. Users describe a topic or paste content, and the app generates an interactive visual concept map. The AI can expand nodes, suggest connections, and help users explore and structure knowledge visually.

---

## 2. Goals

- Enable rapid concept map creation from a text prompt or idea
- Use AI to augment the user's thinking — not replace it
- Keep the app simple, fast, and dependency-light
- Run entirely in the browser with no backend or database

---

## 3. Users

| Attribute | Detail |
|---|---|
| Type | Solo / personal use |
| Technical level | Moderate — comfortable with web apps |
| Use context | Research, learning, planning, knowledge structuring |

---

## 4. Core Requirements (MVP)

### 4.1 Canvas

| ID | Requirement |
|---|---|
| C-01 | Display an interactive node-edge canvas using React Flow |
| C-02 | Allow users to add nodes manually via double-click or button |
| C-03 | Allow users to edit node labels inline |
| C-04 | Allow users to delete nodes and edges |
| C-05 | Allow users to draw edges between nodes manually |
| C-06 | Support pan and zoom on the canvas |
| C-07 | Display a minimap for navigation on large maps |
| C-08 | Display edge label captions on the canvas at all times for all edges that have a label (AI-generated and manually drawn) |
| C-09 | Allow users to set or edit an edge label caption by double-clicking the edge, using the same inline edit interaction as node label editing |
| C-10 | Allow the user to convert an existing labelled single edge into a branching edge via a right-click context action on the edge label ("Branch") |
| C-11 | Render a branching edge as a single line from the source node terminating at a shared label hub, with individual directional arrows fanning out from the bottom of the label hub to each target node |
| C-12 | Allow the user to add an adjacent target to a branching edge by dragging from the label hub to an existing node on the canvas, or to an empty canvas area to create and connect a new node |
| C-13 | Store branching edges in the JSON map data as a distinct structure: one source node ID, one label string, and an ordered list of target node IDs |
| C-14 | When all but one target is removed from a branching edge, automatically convert it back to a plain single edge |
| C-15 | Allow target nodes of a branching edge to be freely positioned anywhere on the canvas; branch arrows must update dynamically to follow the current node positions |
| C-16 | Deleting the edge segment between the source node and the label hub, or selecting and deleting the label hub itself, removes the entire branching edge (all branch arrows) while leaving all target nodes on the canvas; deleting an individual branch arrow (between the label hub and a target node) removes only that branch |
| C-17 | Allow the user to reposition a branching edge label hub by dragging it; branch arrows must update dynamically to reflect the new label position |

### 4.2 AI — Map Generation

| ID | Requirement |
|---|---|
| A-01 | Provide a prompt input where users describe a topic or paste text |
| A-02 | On submit, call the Claude API and generate a structured concept map (nodes + edges) |
| A-03 | Render the AI-generated map on the canvas automatically |
| A-04 | Show a loading state while the AI is processing |
| A-05 | Handle and display API errors gracefully |

### 4.3 AI — Node Expansion

| ID | Requirement |
|---|---|
| A-06 | Right-click a node to reveal an "Expand" option |
| A-07 | On expand, call the Claude API to generate related child nodes |
| A-08 | Append generated child nodes and edges to the existing map |
| A-09 | Prevent duplicate nodes from being added on repeated expansions |

### 4.4 API Key Management

| ID | Requirement |
|---|---|
| K-01 | Provide a settings panel for the user to enter their Anthropic API key |
| K-02 | Store the API key in localStorage only — never transmitted to any server |
| K-03 | Prompt the user to enter their key if an AI action is triggered without one |
| K-04 | Allow the user to clear/update their stored API key |

### 4.5 Persistence — Export & Import

| ID | Requirement |
|---|---|
| P-01 | Allow the user to save the current map as a JSON file |
| P-02 | Allow the user to load a previously saved JSON map file |
| P-03 | JSON format must preserve all node positions, labels, and edge data |

### 4.6 Export

| ID | Requirement |
|---|---|
| E-01 | Allow the user to export the canvas as a PNG image |
| E-02 | PNG export must capture the full map, not just the visible viewport |

### 4.7 Visual Design

| ID | Requirement |
|---|---|
| V-01 | Dark theme throughout — consistent with ConceptForge brand |
| V-02 | Nodes styled with clear label readability |
| V-03 | Edges rendered with directional arrows |
| V-04 | Responsive layout — usable on desktop screens (1280px+) |

### 4.8 Focus Question

| ID | Requirement |
|---|---|
| F-01 | Display a persistent focus question bar at the top of the canvas at all times |
| F-02 | When the focus question is empty, display placeholder text: "Enter your focus question or statement…" |
| F-03 | Allow the user to click the bar and type or edit the focus question at any point during map creation |
| F-04 | Style the bar prominently — visually distinct from the toolbar, using accent colour and larger typography consistent with the dark theme |
| F-05 | Save the focus question as part of the map's JSON data alongside nodes and edges |
| F-06 | Restore the focus question when a saved JSON map is loaded |
| F-07 | When a focus question is present, include it as context in the AI prompt for both map generation (A-02) and node expansion (A-07) |

---

## 5. Nice to Have (Post-MVP)

| ID | Feature | Description |
|---|---|---|
| N-01 | Suggest connections | AI scans existing nodes and proposes new edges between them |
| N-02 | Document upload | Upload PDF, Word, or .txt — AI builds map from extracted text |
| N-03 | URL ingestion | Paste a URL — app fetches page content and generates a map |
| N-04 | SVG export | Export map as scalable vector graphic |
| N-05 | Node types | Visual distinction between concept, question, source, and insight nodes |
| N-06 | Undo / redo | Full history stack for canvas actions |
| N-07 | Keyboard shortcuts | Power-user shortcuts for common actions |
| N-08 | Onboarding | First-use guided prompt to help users get started |

---

## 6. Technical Constraints

| Constraint | Detail |
|---|---|
| Frontend only | No backend server required for MVP |
| AI provider | Anthropic Claude API (user-supplied key) |
| Node graph library | React Flow |
| Build tool | Vite |
| Language | TypeScript / React (JSX) |
| Deployment | fly.io (static — nginx container) |
| Browser support | Modern evergreen browsers (Chrome, Firefox, Edge, Safari) |

---

## 7. Out of Scope (v1)

- User authentication or accounts
- Cloud storage or sync
- Real-time collaboration
- Mobile / touch support
- Multi-language UI

---

## 8. AI Output Contract

The Claude API must return concept map data in the following JSON structure:

```json
{
  "nodes": [
    { "id": "1", "label": "Main Concept" },
    { "id": "2", "label": "Related Concept" }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "relates to" }
  ]
}
```

The app will validate and sanitise this output before rendering.

---

## 9. Success Criteria

- User can generate a concept map from a prompt in under 10 seconds
- User can expand any node with one right-click action
- Map can be saved as JSON and reloaded with full fidelity
- PNG export captures the complete canvas
- App works entirely offline except for Claude API calls

---

*Version 1.3 — March 2026 — Added C-10 → C-17 (Branching edges: fan-out visual, hub repositioning, distinct JSON structure, partial/full delete behaviour)*
