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
| C-11 | Render a branching edge as a single line from the source node terminating at a shared label hub, with individual directional arrows from the label hub to each target node. The hub exposes handles distributed around its full boundary — all visually hidden at all times (opacity 0). The stem edge attaches to the hub side nearest the source node; each branch arrow attaches to the hub side nearest its target node. Both attachment points update dynamically as the source node, hub, or target node positions change. |
| C-12 | Allow the user to add an adjacent target to a branching edge by hovering near the label hub boundary until a connection handle becomes visible, then dragging from that handle to an existing node on the canvas or to an empty canvas area to create and connect a new node. |
| C-13 | Store branching edges in the JSON map data as a distinct structure: one source node ID, one label string, and an ordered list of target node IDs |
| C-14 | When all but one target is removed from a branching edge, automatically convert it back to a plain single edge |
| C-15 | Allow target nodes of a branching edge to be freely positioned anywhere on the canvas; branch arrows must update dynamically to follow the current node positions |
| C-16 | Deleting the edge segment between the source node and the label hub, or selecting and deleting the label hub itself, removes the entire branching edge (all branch arrows) while leaving all target nodes on the canvas; deleting an individual branch arrow (between the label hub and a target node) removes only that branch |
| C-17 | Allow the user to reposition a branching edge label hub by dragging it; the stem edge and all branch arrows must update dynamically to reflect the new hub position, each re-attaching to the hub side nearest their respective source or target node. |
| C-18 | Each node exposes four handles — one per side (top, right, bottom, left) — all visually hidden (opacity 0) at all times. Any handle may be used to start an outgoing edge regardless of how many incoming edges it already has. Any handle may receive one or more incoming edges. |
| C-19 | When the user drags an edge from any node handle and releases it on an empty area of the canvas, automatically create a new node at the drop position, connect it to the source node, and immediately place the new node in inline edit mode with a blank label — identical behaviour to double-clicking empty canvas to create a node |
| C-20 | When a single (non-branching) edge has a label, render the label as a draggable waypoint; the user may drag it freely to any position on the canvas to reposition it |
| C-21 | When a single edge label has been repositioned from its default midpoint, render the edge as two straight directed segments — source node → label (no arrowhead) and label → target node (with arrowhead) — both segments updating dynamically as the source node, target node, or label waypoint position changes |
| C-22 | Save a repositioned single edge label's canvas coordinates as part of the edge's JSON data; restore the custom position and two-segment routing when the map is loaded |
| C-23 | Add a "Select" toggle item to the canvas pane right-click context menu (the same menu defined by G-01); when selection mode is active the menu item is visually marked as active (e.g. checkmark or highlighted label); clicking it again exits selection mode; pressing Escape also exits selection mode |
| C-24 | In selection mode, dragging on an empty area of the canvas draws a rubber-band selection rectangle; all nodes, edges, and notes that fall within the rectangle are selected when the drag is released |
| C-25 | In selection mode, holding Space while dragging pans the canvas instead of drawing a selection rectangle |
| C-26 | When two or more items are selected, dragging any selected node or note moves the entire selection together; edges follow their connected nodes automatically and do not disconnect from their source node or label hub |
| C-27 | Pressing the Delete key while one or more items are selected removes all selected nodes, notes, and any edges directly attached to a deleted node |
| C-28 | Add an "Edit Info" action to the node right-click context menu; selecting it opens a popover panel positioned near the node containing a short freeform text input pre-filled with any existing description; clicking outside the popover saves the current text (including empty, which clears the description) |
| C-29 | When a node has a non-empty description, display a small green dot indicator inside the node boundary at the top-right corner, with a small margin from the node's border lines so it does not touch the edges; the dot must be smaller than the current size and must not obstruct the node label; when the description is absent or empty, the dot must not be shown |
| C-30 | When the user hovers the cursor over a node's green info dot, display a read-only popover showing the description text; the popover disappears automatically when the cursor moves away from the dot |
| C-31 | Allow the user to reconnect the target end of any edge by dragging it away from its current target node and dropping it onto a different node handle; if dropped on empty canvas or a non-handle area, the edge snaps back to its original target node; this applies to both single edges and to the individual branch arrows of a branching edge (the hub-to-target segments) |
| C-32 | When the user hovers within the reconnect grab zone near the target endpoint of an edge, that edge's label turns orange to indicate it is the edge that would be grabbed if a reconnect drag is initiated; the label returns to its default colour when the cursor leaves the zone |
| C-33 | Clicking an edge path or its label selects that edge, making only its target endpoint draggable for reconnection; when the user subsequently hovers near any target endpoint on the canvas, the last selected edge's label turns orange to confirm it is the active edge for reconnection; unselected edges' endpoints are not draggable; clicking elsewhere on the canvas deselects and restores normal behaviour |
| C-34 | When a single node is selected and an arrow key is pressed without any modifier, select the neighbour node connected by any edge (incoming or outgoing) whose position is most directly in that direction (smallest angular deviation from the arrow's axis); if no connected neighbour exists in that direction, do nothing |
| C-35 | When nothing is selected and an arrow key is pressed (with or without Alt modifier), first select a random node on the canvas and take no further navigation action for that keypress; when multiple items are selected and an arrow key is pressed without modifiers, cancel the current selection and select a random node |
| C-36 | When a single edge is selected and an arrow key is pressed without any modifier, do nothing |
| C-37 | When Alt+Arrow is pressed and a single node is selected, select the edge connected to that node (incoming or outgoing) whose other endpoint is most directly in the arrow's direction; when Alt+Arrow is pressed and a single edge is selected, use that edge's source node as the pivot and select the edge connected to it (incoming or outgoing) whose other endpoint is most directly in the arrow's direction; if no matching edge exists in that direction, do nothing; if nothing is selected, first select a random edge |
| C-38 | Remap keyboard nudge: Ctrl+Arrow moves the currently selected node or edge by the canvas default nudge increment; plain arrow keys no longer move canvas items |
| C-39 | When the user enters or exits inline label edit mode on a concept node (via double-click, Enter, or F2), the canvas viewport must not zoom or scroll; the current position and zoom level must remain unchanged throughout the edit interaction |
| C-40 | When the user manually draws a new edge between two nodes (including the edge created via drag-to-empty-canvas, C-19), automatically set its label to `?`; the label is not placed in edit mode and remains `?` until the user double-clicks it to change it (C-09); AI-generated edges (from Generate Map, Suggest Concepts, and Expand) are unaffected and always receive the label produced by Claude |

### 4.2 AI — Map Generation

| ID | Requirement |
|---|---|
| A-01 | Provide a prompt input where users describe a topic or paste text |
| A-02 | On submit, call the Claude API and generate a structured concept map (nodes + edges) |
| A-03 | Render the AI-generated map on the canvas automatically |
| A-04 | Show a loading state while the AI is processing |
| A-05 | Handle and display API errors gracefully |
| A-11 | When the user enters a focus question, display two inline action buttons: **"Generate Map"** (Mode 1) and **"Suggest Concepts"** (Mode 2); if neither is clicked the user proceeds manually with the Expand action still available |
| A-12 | Mode 1 — Generate Map: call the Claude API to produce a full concept map (nodes + edges) from the focus question and render it on the canvas; after generation the user may continue manually and/or use Expand on any node |
| A-13 | Mode 2 — Suggest Concepts: call the Claude API to produce a set of concept nodes only (no edges) from the focus question; place them distributed around the outer area of the canvas; the user draws all edges manually |
| A-14 | When Mode 2 is invoked on a canvas that already contains nodes, exclude any suggested concept whose label matches an existing node label (case-insensitive); only novel concepts are added |
| A-15 | Each concept node generated by Mode 2 must include a short AI-generated description pre-populated in the node's description field (C-28), visible via the green dot and hover tooltip |
| A-23 | Each node generated by Mode 1 (Generate Map) must include a short AI-generated description (1–2 sentences) returned as a `description` field in the JSON response alongside the node label; the description must be pre-populated in the node's description field (C-28) and visible via the green dot indicator and hover tooltip — matching the behaviour defined by A-15 for Mode 2 |
| A-24 | After Mode 1 renders nodes on canvas, after Mode 2 places suggested concept nodes, and after Expand (A-07) appends child nodes, the layout engine must guarantee that no two nodes overlap each other and no node label overlaps any adjacent node; layout is applied automatically with no user action required |
| A-25 | After Mode 1 renders the map, after Mode 2 places suggested concept nodes, and after Expand appends child nodes, automatically trigger fit-to-view so all newly placed content is fully visible within the canvas viewport without requiring manual user action |

### 4.3 AI — Node Expansion

| ID | Requirement |
|---|---|
| A-06 | Right-click a node to reveal an "Expand" option |
| A-07 | On expand, call the Claude API to generate related child nodes |
| A-08 | Append generated child nodes and edges to the existing map |
| A-09 | Prevent duplicate nodes from being added on repeated expansions |
| A-10 | When expanding a node that has a non-empty description (C-28), include the description as additional context in the AI prompt alongside the node label |
| A-26 | Add a "Chat" item to the concept node right-click context menu; the item is always visible; when AI Assist is off it is dimmed and non-interactive, matching the availability behaviour of Expand (K-08) |
| A-27 | Selecting "Chat" opens the AI Chat panel; if the Summary Panel is currently visible, dismiss it and replace it with the Chat panel; both panels cannot be visible at the same time |
| A-28 | Style and position the Chat panel identically to the Summary Panel (A-16, A-22); display a heading identifying the concept being discussed (the node's label) |
| A-29 | The Chat panel contains a scrollable message history area and a text input at the bottom; the user types a message and submits it (Enter key or a send button); the AI responds inline; every AI request includes the node's label, its description (if present), and the current focus question as context |
| A-30 | Message history persists while the Chat panel is open; history is cleared when the panel is dismissed or when Chat is opened for a different node |
| A-31 | Each AI response message in the Chat panel must display a persistent icon button (reading view); clicking the button opens a reading panel showing only that message's content — no other messages are included |
| A-32 | The reading panel is centred in the viewport, sized at 70% of viewport width and 70% of viewport height; it renders the AI message content as markdown (bold, headings, bullet lists, code blocks); it contains an explicit dismiss button and also closes when the user clicks outside the panel boundary |
| A-33 | Include the concept chat system prompt (retrieved from K-09 storage, falling back to the default if absent) as the `system` parameter in every Chat panel API call initiated against a concept node; the system prompt is sent once per conversation, not repeated in the message history; this prompt must not be applied to any other chat type introduced in future. Default system prompt text: *"You are an expert knowledge assistant embedded in a concept mapping tool. Your role is to help the user deeply understand the concept they are exploring. Ground every response in the specific concept and its relationship to the focus question. Be concise, accurate, and educational — avoid tangents, excessive caveats, and generic advice. Prefer structured explanations with clear reasoning. When listing items, keep lists short and focused. Base all factual claims on credible sources and cite them inline. At the end of every response, provide a Resources section with up to 5 relevant links to authoritative sources."* |
| A-34 | Add "Suggest Labels" and "Explain Label" items to the single-edge right-click context menu; these items do not appear on branching edge hub right-click menus. "Suggest Labels" is always present on single edges (regardless of current label). "Explain Label" is present only when the edge has a label other than `?`. Both items are dimmed and non-interactive when AI Assist is off (K-08) |
| A-35 | When "Suggest Labels" is invoked, call Claude using the K-10 system prompt, passing the source and target node labels, their descriptions if present, and the current focus question if set; display the response in a reading panel (same component as A-32) titled "Suggest Labels"; the response must open with an ASCII relationship diagram — `[Source Concept] -- ? --> [Target Concept]` — followed by a numbered list of 3–5 candidate labels, each with a short paragraph explaining why it accurately describes the directed relationship; the panel has only a dismiss button; no label is applied to the edge automatically |
| A-36 | When "Explain Label" is invoked, call Claude using the K-10 system prompt, passing the existing edge label, the source and target node labels, their descriptions if present, and the current focus question if set; display the response in a reading panel titled "Explain: `<label>`" with only a dismiss button; the response explains the meaning and rationale of the labelled relationship in context |
| A-37 | Apply the K-10 Edge Label system prompt as the `system` parameter to Suggest Labels (A-35), Explain Label (A-36), and Suggest Concepts (A-39) API calls; this prompt must not be applied to any other AI operation |
| A-38 | Add a "Suggest Concepts" item to the right-click context menu of single-edge labels and branching edge hub labels. The item is dimmed and non-interactive when the edge label is `?`. The item is also dimmed and non-interactive when AI Assist is off (K-08) |
| A-39 | When "Suggest Concepts" is invoked on an edge or hub label, call Claude using the K-10 system prompt, passing: the source node label and description (if present), the edge label, the focus question (if set), and — for branching edges — the labels of all existing target nodes (so the AI can avoid duplicating them); display the response in a reading panel (A-32) titled "Suggest Concepts"; the response opens with an ASCII relationship diagram (`[Source Concept] -- label --> [?]`), followed by a numbered list of 3–5 candidate target concept names each accompanied by a brief explanatory paragraph describing why that concept fits the directed relationship; the panel has only a dismiss button; no node is created automatically |
| A-40 | Extend the Suggest Labels panel (A-35) with a selectable control (one selection at a time) adjacent to each candidate label; when a label is selected the "Apply" button becomes active, otherwise it is dimmed and non-interactive; clicking Apply sets the selected label on the edge and closes the panel; the existing dismiss button remains so the user can close without applying |
| A-41 | Extend the Suggest Concepts panel (A-39) with a checkbox adjacent to each candidate concept; when one or more are checked the "Apply" button becomes active, otherwise it is dimmed and non-interactive; clicking Apply creates a concept node for each checked suggestion — populating its description field (C-28) with the AI-generated explanatory paragraph for that concept — and connects each to the source node via the existing edge label; if the edge is currently a single edge it is automatically converted to a branching edge (C-10) with the original target and all newly created nodes as branch targets; if invoked from a branching hub the new nodes are added as additional branch targets; the panel closes after Apply; the existing dismiss button remains |

### 4.4 API Key Management

| ID | Requirement |
|---|---|
| K-01 | Provide a settings panel for the user to enter their Anthropic API key |
| K-02 | Store the API key in localStorage only — never transmitted to any server |
| K-03 | Prompt the user to enter their key if an AI action is triggered without one |
| K-04 | Allow the user to clear/update their stored API key |
| K-05 | Display an "AI Assist" toggle switch in the Settings panel, positioned below the API key input field; the toggle defaults to off on first use |
| K-06 | Automatically enable the AI Assist toggle when the user saves an API key; automatically disable it when the API key is removed or cleared |
| K-07 | Persist the AI Assist toggle state to `localStorage`; on page load, if no API key is stored, the toggle is always off regardless of the persisted value |
| K-08 | When AI Assist is off, dim all AI-triggered controls and make them non-interactive (reduced opacity, pointer events disabled); affected controls: Generate Map button, Suggest Concepts button, and the Expand action in the node right-click context menu |
| K-09 | Add a "Concept Chat" system prompt section to the Settings panel, positioned below the AI Assist toggle; display an editable multi-line textarea pre-filled with the default system prompt text; provide a "Reset to default" button that restores the textarea to the default text without requiring a save action; persist the user's edited value to `localStorage` under a namespaced key; on page load restore the persisted value if present, otherwise use the default; the section heading must name the chat objective ("Concept Chat") so future chat objectives can each have their own prompt |
| K-10 | Add an "Edge Label" system prompt section to the Settings panel, positioned below the Concept Chat section; same pattern as K-09 (editable textarea, Reset to default button, localStorage persistence under a namespaced key, section heading "Edge Label"); default system prompt text: *"You are an expert knowledge assistant embedded in a concept mapping tool. Your role is to help the user understand and name directed relationships between concepts, and to suggest meaningful target concepts for a given relationship. When suggesting edge labels, generate concise, directionally accurate labels (1–4 words each) that meaningfully describe the relationship from the source concept to the target concept; accompany each suggestion with a short paragraph explaining why it accurately describes the directed relationship. When explaining a label, describe in a short paragraph why the relationship holds between the two concepts given their context. When suggesting target concepts for a directed relationship, generate concise, meaningful concept names with a brief explanatory paragraph for each — explaining why that concept fits as a target given the source and the relationship label; avoid repeating any existing target concepts supplied in the context. Only generate output when the concept names and descriptions are meaningful — if they appear to be placeholders (e.g. 'New Concept'), acknowledge this and provide best-effort suggestions."* |

### 4.5 Persistence — Export & Import

| ID | Requirement |
|---|---|
| P-01 | Allow the user to save the current map as a JSON file |
| P-02 | Allow the user to load a previously saved JSON map file |
| P-03 | JSON format must preserve all node positions, labels, edge data, and notes |
| P-04 | When the app loads with a `?autoload=<base64>` query parameter present, decode it from base64, validate it as `MapData`, and load the resulting map onto the canvas automatically |
| P-05 | Immediately after processing the `?autoload=` parameter — whether successful or not — remove it from the browser URL using `history.replaceState()` so the encoded data does not persist in browser history |
| P-06 | If the `?autoload=` parameter fails base64 decoding or `MapData` validation, display a visible error message to the user indicating the map could not be loaded from the URL, and leave the canvas in its default empty state |
| P-07 | Save each node's description in the map's JSON data; restore descriptions when a saved map is loaded; node descriptions must not be rendered in PNG canvas exports |
| P-08 | When the user triggers Save, present the browser's native save-file dialog allowing the user to choose a destination folder and filename; the dialog is pre-populated with the previously used filename for the session, or a default name if no prior save has occurred in the session; confirming the dialog writes the map as a `.json` file to the chosen location; cancelling aborts the save without writing any file |
| P-09 | On browsers where a native save-file dialog is unavailable, fall back to displaying a filename input prompt; the input is pre-populated with the previously used filename for the session, or empty if none; the filename entered by the user is stored and used to pre-populate the dialog or prompt on the next save; confirming downloads the map JSON to the default downloads folder as `<filename>.json`; cancelling aborts the save without writing any file |

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
| V-03 | All edges — regular edges, branching edge stems, and branching edge arrows — must render as straight lines with directional arrowheads. Curved or bezier paths are not permitted |
| V-04 | Responsive layout — usable on desktop screens (1280px+) |
| V-05 | Node labels must be horizontally centred within the node |
| V-06 | Edge label captions and branching edge hub labels must be rendered as plain floating text: no visible border, no background fill, transparent container, at a font size of `9px` — matching the visual treatment of single edge label captions exactly |
| V-07 | When the canvas contains no nodes, display a low-opacity "Double click to start" hint centred on the canvas; the hint disappears when a node is present and reappears if all nodes are removed |
| V-08 | The canvas must never auto-fit the viewport in response to node additions or changes. On initial load with no nodes, the canvas starts at a default zoom of `0.85`. When a saved map is loaded, the viewport is fitted to content once (padding `0.5`, maximum zoom `0.85`). The fitView button in the canvas Controls remains available at all times and is not subject to the `0.85` cap |
| V-09 | The rubber-band selection rectangle must render as a subtle frame: a thin single-pixel border in the orange accent colour (`#f97316`) at low opacity, with a near-transparent fill of the same colour; no solid background, no drop shadow |
| V-10 | Each selected item (node or note) in a multi-selection must display the same orange border highlight used for single-item selection; when multiple items are selected, all selected items show this highlight simultaneously |
| V-11 | All edge arrowheads — on single concept edges and branching edge branch arrows — must render at a uniform size equal to the selected-state arrowhead size; arrowhead colour is unaffected by this change |

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

### 4.9 Notes & Groups

| ID | Requirement |
|---|---|
| G-01 | Display a context menu when the user right-clicks on an empty area of the canvas pane, offering two actions: "Add Node" (creates a concept node at the cursor position, equivalent to double-clicking the canvas) and "Add Note" (creates a note at the cursor position with a default background colour). Double-click to create a node remains unchanged. |
| G-02 | Render notes as canvas elements that always appear behind all nodes and edges. This z-index must remain unchanged during all interactions, including while the note's text is being edited. |
| G-03 | Allow the user to resize a note freely by clicking and dragging its edge and corner handles. Resize handles become visible when the cursor hovers over the note border and are available at all times — the note does not need to be selected first. |
| G-04 | Allow the user to reposition a note by dragging its body. |
| G-05 | Allow the user to change a note's background colour via the "Edit Note" action in the note's right-click context menu, selecting from a predefined palette of 10 colours; notes are created with a default colour from this palette. |
| G-06 | Allow the user to change the text size of a note's label via the "Edit Note" action in the note's right-click context menu, selecting from a predefined set of sizes. |
| G-07 | Double-clicking on a note's background (not the text content) creates a new concept node at the cursor position, identical to double-clicking empty canvas. Double-clicking on a note's existing text content enters inline text-edit mode for that text; display the text anchored to the top-left of the note interior. |
| G-08 | Automatically derive the note's text colour from its background colour to ensure readable contrast at all times — the user does not set text colour directly. |
| G-09 | Allow the user to delete a note via the "Delete Note" action in the note's right-click context menu. |
| G-10 | Include notes in the map's saved JSON data, preserving position, dimensions, background colour, text content, and text size; restore notes fully when a saved map is loaded. |
| G-11 | When the user right-clicks a note, display a context menu with four actions: "Add Node" (creates a concept node at the cursor position), "Add Note" (creates a new note at the cursor position), "Edit Note" (opens the background colour and text-size controls), and "Delete Note" (removes the note from the canvas). |
| G-12 | A single left-click on a note performs no action — notes are not selectable via single click and no selection state is applied to a note. |

### 4.10 App Version

| ID | Requirement |
|---|---|
| B-01 | Set the app version in `package.json` (initial value: `0.9.1`) and expose it to the browser bundle at build time via Vite's `define` configuration — the version string must not be hardcoded in any source file |
| B-02 | Display the version string (format: `v{semver}`) bottom-right aligned within the focus question bar at all times, at low opacity so it does not compete with the focus question input |
| B-03 | The GitHub Actions deploy workflow must print the app version (read from `package.json`) as an explicit, named step before `flyctl deploy` runs |
| B-04 | The fly.io deployment must be tagged with the app version as a Docker image label (e.g. `org.opencontainers.image.version`) |

### 4.11 Hint Ticker

| ID | Requirement |
|---|---|
| H-01 | Display a scrolling hint ticker as a fixed overlay anchored to the bottom of the canvas viewport; the bar is visible by default on every page load |
| H-02 | Display one hint at a time: each hint slides in from the right edge of the bar; once fully in view, the hint pauses long enough to be read; it then disappears instantly (no outgoing animation); the next hint immediately begins sliding in from the right. The hint text travels across the full width of the bar, passing in front of the dismiss button. Hint copy must be brief and direct — no more than eight words per hint. |
| H-03 | Provide a small icon button at the right edge of the ticker bar to dismiss it; when dismissed, display a small persistent toggle icon anchored to the bottom-right corner of the canvas that restores the bar |
| H-04 | Reset the bar to visible on every page load — the hidden/visible preference is not persisted to localStorage |
| H-05 | Pause the scrolling animation while the user's cursor hovers over the ticker bar; resume scrolling when the cursor leaves |
| H-06 | Style the bar as a subtle, non-intrusive overlay: semi-transparent dark background, small typography, all colour values sourced from `theme.ts`; the bar must not obstruct the canvas controls, toolbar, or focus question bar |

---

### 4.12 Skill Distribution

| ID | Requirement |
|----|-------------|
| SK-01 | The `/cmap` skill file must carry an independent version number in a comment header at the top of the file (e.g. `<!-- version: 1.0 -->`); this version is incremented whenever the skill content changes and is completely independent of the ConceptForge app version |
| SK-02 | When the `/cmap` skill is invoked with `version` as the sole argument, it must read and report its own embedded version number; if network is available it must also fetch the latest version from the GitHub Pages manifest and tell the user whether they are up to date or behind |
| SK-03 | A `skills/` directory in the repo contains `cmap.md` (the versioned skill file) and `manifest.json` (`{ "version": "x.y" }`); a dedicated GitHub Actions workflow deploys this directory to GitHub Pages on every push to `main` that touches `skills/`, independently of the fly.io deployment |
| SK-04 | On application load, ConceptForge fetches the skills manifest from GitHub Pages and displays the available `/cmap` skill version inside the toolbar menu; if the fetch fails the version shows as "unavailable" without disrupting the UI |
| SK-05 | Replace the current standalone settings button in the toolbar with a single menu button; the menu contains four actions: **Save**, **Load**, **Settings**, and **Download cmap skill** — the last item shows the available version number inline (e.g. "Download cmap skill v1.0") |
| SK-06 | Selecting "Download cmap skill" from the menu triggers a download of `cmap.md` from GitHub Pages and displays a placement instruction panel telling the user the exact path to place the file: `~/.claude/commands/cmap.md` on macOS/Linux and `%USERPROFILE%\.claude\commands\cmap.md` on Windows |
| SK-07 | The AppMenu closes when the user clicks outside the menu, presses Escape, or clicks the menu button a second time while the menu is open |

---

### 4.13 AI Summary Panel

| ID | Requirement |
|---|---|
| A-16 | After Mode 1 (Generate Map) renders the map on canvas, display a semi-transparent summary panel overlaying the right edge of the canvas; the panel spans vertically from just below the menu button to the bottom of the viewport; the panel must not appear during the loading state — only once generation is complete and the map is visible |
| A-17 | After Mode 2 (Suggest Concepts) places nodes on canvas, display the same summary panel with a narrative about the topic and the suggested concepts |
| A-18 | The panel contains: (a) a narrative paragraph explaining the topic and why these concepts were selected, and (b) a labelled list of up to 5 hyperlinks to online resources related to the topic — both generated by Claude as part of the same API call as the map or concepts, returned as additional fields alongside the nodes and edges in the JSON response |
| A-19 | The narrative text must appear with a typewriter animation — characters are revealed one at a time at a natural human typing pace; resource links appear below the narrative once the typewriter animation completes |
| A-20 | A dismiss button appears once the typewriter animation completes; clicking it removes the panel; the panel does not reappear until the next generation action is triggered |
| A-21 | If the panel content (narrative + links) exceeds the panel's visible height, the content area must be independently scrollable |
| A-22 | Style the panel as a semi-transparent dark overlay, all colour values sourced from `theme.ts`; resource links open in a new browser tab with `rel="noopener noreferrer"`; panel width and spacing are left to the implementation agent |

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
| N-09 | URL map sharing | Allow the user to copy a shareable `?autoload=<base64>` URL for the current map to the clipboard via a toolbar button; the recipient opens the URL to see the map load automatically |

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

### Mode 1 — Generate Map

```json
{
  "nodes": [
    { "id": "1", "label": "Main Concept", "description": "A 1–2 sentence definition of this concept." },
    { "id": "2", "label": "Related Concept", "description": "A 1–2 sentence definition of this concept." }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "relates to" }
  ],
  "narrative": "A short paragraph explaining the topic and why these concepts were chosen.",
  "resources": [
    { "label": "Wikipedia — Topic Name", "url": "https://en.wikipedia.org/wiki/Topic" }
  ]
}
```

### Mode 2 — Suggest Concepts

```json
{
  "concepts": [
    { "id": "1", "label": "Concept Name", "description": "Brief description." }
  ],
  "narrative": "A short paragraph explaining the topic and why these concepts were suggested.",
  "resources": [
    { "label": "Wikipedia — Topic Name", "url": "https://en.wikipedia.org/wiki/Topic" }
  ]
}
```

`narrative` and `resources` are required fields in both response shapes. The app validates and sanitises all output before rendering. Resource URLs are Claude-provided and are not verified for liveness by the app.

---

## 9. Success Criteria

- User can generate a concept map from a prompt in under 10 seconds
- User can expand any node with one right-click action
- Map can be saved as JSON and reloaded with full fidelity
- PNG export captures the complete canvas
- App works entirely offline except for Claude API calls

---

*Version 3.1 — March 2026 — Added C-28, C-29, C-30 (node descriptions — Edit Info popover, green dot indicator, hover tooltip); added A-10 (description context in node expansion); added P-07 (node description persistence in JSON)*

*Version 3.2 — March 2026 — Refined C-29: green dot repositioned inside node boundary at top-right corner with margin from border lines; dot size reduced*

*Version 3.3 — March 2026 — Added SK-01 through SK-06 (Skill Distribution: versioned /cmap skill, GitHub Pages skill server, toolbar menu consolidation, in-app skill download with placement instructions)*

*Version 3.4 — March 2026 — Added SK-07 (AppMenu dismiss: click outside, Escape, or toggle button)*

*Version 3.5 — March 2026 — Updated V-06: branching edge hub label must render as plain floating text (no background, no border, transparent container) matching single edge label captions*

*Version 3.6 — March 2026 — Added A-11 through A-15 (AI generation modes: Mode 1 full map, Mode 2 concepts-only with descriptions, mode selection from focus question bar)*

*Version 3.7 — March 2026 — Added A-16 through A-22 (AI Summary Panel: typewriter narrative, resource links, semi-transparent sidebar, dismiss on complete); extended Section 8 AI Output Contract for Mode 1 and Mode 2 to include `narrative` and `resources` fields*

*Version 3.8 — March 2026 — Added A-23 (Mode 1 node descriptions matching A-15 for Mode 2), A-24 (automatic non-overlapping layout after Mode 1, Mode 2, and Expand), A-25 (automatic fit-to-view after Mode 1, Mode 2, and Expand); updated Section 8 Mode 1 output contract to include `description` field on each node*

*Version 3.9 — March 2026 — Added C-31 (edge target reconnection: drag target endpoint to re-attach to a different node handle; snap-back on empty canvas drop; applies to single edges and branching edge branch arrows)*

*Version 4.0 — March 2026 — Added C-32 (hover-on-endpoint turns edge label orange to preview which edge would be grabbed); added C-33 (click to select an edge makes only its target endpoint draggable for reconnection; selected edge label turns orange on hover near any endpoint)*

*Version 4.1 — March 2026 — Added C-34 through C-38 (keyboard navigation: arrow keys navigate node-to-node by graph topology; Alt+Arrow navigates to edges; Ctrl+Arrow moves items; remaps existing plain-arrow nudge to Ctrl+Arrow)*

*Version 4.2 — March 2026 — Refined C-34 and C-37: navigation now considers all connected edges (incoming and outgoing), not outgoing-only*

*Version 4.3 — March 2026 — Added K-05 through K-08 (AI Assist toggle: off by default, auto-enables on key save, auto-disables on key removal, persisted to localStorage, dims and disables AI controls when off)*

*Version 4.4 — March 2026 — Added A-26 through A-30 (AI Node Chat: Chat item in node context menu, chat panel replacing summary panel, concept and focus question context, scrollable message history)*

*Version 4.5 — March 2026 — Updated C-18: handles may now be used as both edge source and edge target simultaneously (removed restriction that a handle with incoming edges cannot be a source); Added C-39: viewport must not zoom or scroll when entering or exiting inline label edit mode*

*Version 4.6 — March 2026 — Updated C-11: hub handles now distributed around full boundary, all hidden (opacity 0), stem and branch arrows attach to nearest side dynamically; removed visible bottom handle. Updated C-12: user initiates new branch drag by hovering hub boundary until handle appears. Updated C-17: stem edge now also repositions dynamically when hub is moved, not branch arrows only.*

*Version 4.7 — March 2026 — Added A-31 (reading view button on each Chat panel AI response) and A-32 (reading panel: centred, 70% viewport, markdown rendering, dismiss button and outside-click dismissal)*

*Version 4.8 — March 2026 — Added P-08 (filename prompt on Save: empty on first save, pre-populated on subsequent saves, .json suffix appended automatically, confirm disabled while empty, cancel aborts)*

*Version 4.9 — March 2026 — Added K-09 (Concept Chat system prompt in Settings: editable textarea, Reset to default, localStorage persistence) and A-33 (system prompt sent as `system` parameter on every concept node chat API call; includes citation and resources requirements in default prompt)*

*Version 5.0 — March 2026 — Added C-40 (new manually drawn edges default to `?` label; AI-generated edges unaffected)*

*Version 5.1 — March 2026 — Added A-34 through A-37 (AI edge label assistance: Suggest Labels and Explain Label on single-edge context menu, reading panel display, K-10 system prompt applied to both); added K-10 (Edge Label system prompt in Settings)*

*Version 5.2 — March 2026 — Added A-38 through A-39 (Suggest Concepts on single-edge and hub right-click menus: AI suggests target concepts from source, label, focus question, and existing targets; reading panel display); updated A-37 to include A-39; updated K-10 default system prompt to cover concept suggestion guidance*

*Version 5.3 — March 2026 — Added A-40 (interactive label selection in Suggest Labels panel with Apply button) and A-41 (interactive concept selection in Suggest Concepts panel with Apply button; auto-converts single edge to branching hub; adds to existing hub targets)*

*Version 5.4 — March 2026 — Updated P-08: replaced custom filename prompt with browser native save-file dialog (pre-populated with previously used filename); added P-09: fallback filename prompt for browsers without native save-file dialog support, with filename stored for next session pre-population*

*Version 5.5 — March 2026 — Added V-11: uniform arrowhead size on all edges (single concept edges and branching edge branch arrows) matching the selected-state arrowhead size; colour unaffected*
