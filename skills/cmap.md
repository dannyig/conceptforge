<!-- version: 1.0 -->
# /cmap

Generate a ConceptForge concept map from a topic or question, write it to disk, and open it directly in ConceptForge via the `?autoload=` URL.

## Arguments

`$ARGUMENTS` — the topic, question, or idea to map, plus an optional output path. If the topic is empty, ask the user before proceeding.

---

## Version check (SK-02)

If `$ARGUMENTS` is exactly `version` (case-insensitive), perform **only** the following and stop — do not generate a map:

1. Report: **"Installed /cmap skill: v1.0"**
2. Run this command to check for updates:

```bash
node -e "
const https = require('https');
https.get('https://dannyig.github.io/conceptforge/manifest.json', res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
      const m = JSON.parse(data);
      const installed = '1.0';
      if (m.version === installed) {
        console.log('You are up to date (v' + installed + ')');
      } else {
        console.log('Update available: v' + m.version + ' — download the latest from ConceptForge (Menu → Download cmap skill)');
      }
    } catch { console.log('Could not parse manifest'); }
  });
}).on('error', () => console.log('Could not reach skill server — check manually at https://conceptforge.fly.dev'));
"
```

3. Stop — do not proceed to any other step.

---

## Step 1 — Plan the map

Think through the following before writing any JSON:

1. **Focus question** — one question this map answers. Phrase it as "What is…?", "How does…?", or "Why does…?".
2. **Central concept** — the root node that anchors everything.
3. **Map shape** — choose the shape that best fits the topic's structure (see Step 2).
4. **Thematic groups** — identify 2–5 clusters of closely related nodes that benefit from being visually grouped. Each group will get a note as a background container.
5. **Key nodes** — decide which nodes belong in each group and which are connectors between groups.
6. **Edge labels** — every edge must carry a short, active-voice relationship label: "drives", "enables", "requires", "produces", "contradicts", "depends on", "consists of", etc.
7. **Branching edges** — when three or more nodes share the exact same relationship to one source, use a `branchingEdge` instead of separate edges.

---

## Step 2 — Choose a map shape

Pick the shape that matches the topic's natural structure. Do not default to hierarchical for every topic.

### A — Hierarchical tree
**Use when:** the topic has clear parent → child taxonomy (classifications, definitions, breakdowns).
**Layout:** root at top centre (x=0, y=0). Level-1 nodes at y=280, spaced with formula `x_i = (i − (N−1)/2) × 300`. Level-2 nodes at y=560, grouped under their parent.

### B — Radial / spoke
**Use when:** a central concept has many equal-weight themes radiating from it (aspects, factors, dimensions).
**Layout:** root at centre (x=0, y=0). Place N themes evenly around a circle of radius 380:
```
x_i = round(380 × cos(2π × i / N))
y_i = round(380 × sin(2π × i / N))
```
Second-ring nodes: radius 680, placed radially outward from their parent.

### C — Flow / process
**Use when:** the topic describes a sequence, pipeline, or timeline (how X happens step by step).
**Layout:** nodes arranged left-to-right. Step nodes at y=0, spaced 300px apart on x. Sub-steps at y=220 or y=−220 directly under/above their parent step.

### D — Cluster / constellation
**Use when:** the topic has several independent but related sub-domains with no single root (ecosystems, technology landscapes).
**Layout:** each cluster is a mini-tree. Place cluster centres far apart (600–800px spacing). Within each cluster, nodes spread 200–250px from the cluster centre. Notes group each cluster visually. A small set of bridge nodes and edges connect the clusters at the centre.

### E — Comparison
**Use when:** the topic contrasts two or more things side by side.
**Layout:** one column per thing being compared, 500–600px apart on x. Shared attributes in the centre column. Row spacing 200px on y.

---

## Step 3 — Assign notes as group containers

For each thematic group identified in Step 1, create a `NoteData` entry that visually contains its nodes.

**Bounding box formula** (calculate per group):
```
group_min_x = min(node.position.x for nodes in group) − 60
group_min_y = min(node.position.y for nodes in group) − 50
group_width  = max(node.position.x for nodes in group) − group_min_x + 220
group_height = max(node.position.y for nodes in group) − group_min_y + 100
```

**Note schema** (all fields required except `text` and `textSize`):
```json
{
  "id": "note1",
  "position": { "x": <group_min_x>, "y": <group_min_y> },
  "width": <group_width>,
  "height": <group_height>,
  "backgroundColor": "<colour from palette>",
  "text": "<group label — short, 1–4 words>",
  "textSize": "small"
}
```

**Colour palette** — use only these exact hex values, one distinct colour per group:

| Colour | Hex |
|---|---|
| Dark blue (default) | `#1e3a5f` |
| Dark green | `#166534` |
| Dark amber | `#854d0e` |
| Dark purple | `#4a1942` |
| Dark red | `#7f1d1d` |
| Dark teal | `#134e4a` |
| Dark yellow-brown | `#3b2f00` |
| Dark indigo | `#1c1c3a` |
| Dark orange-brown | `#2d1b00` |
| Dark forest | `#1a2e1a` |

Notes render **behind** all nodes and edges — they act as region labels, not foreground elements. Keep `text` short so it sits unobtrusively in the note's top-left corner.

Do not create a note that contains only one node — groups need at least two nodes to justify a container.

---

## Step 4 — Assign edge handles

Every edge must specify `sourceHandle` and `targetHandle`. These control which face of each node the edge attaches to. All edges are drawn as straight lines between the two attachment points — choosing the wrong handle causes the edge to visually cross through the connected node's body.

### Handle IDs

| Side | Source handle (outgoing) | Target handle (incoming) |
|---|---|---|
| Top | `"top"` | `"top-t"` |
| Right | `"right"` | `"right-t"` |
| Bottom | `"bottom"` | `"bottom-t"` |
| Left | `"left"` | `"left-t"` |

### Pick the face using the source→target vector

Compute `dx = target.x − source.x` and `dy = target.y − source.y`, then:

| Condition | Source handle | Target handle |
|---|---|---|
| `|dx| ≥ |dy|` and `dx ≥ 0` (target is to the right) | `"right"` | `"left-t"` |
| `|dx| ≥ |dy|` and `dx < 0` (target is to the left) | `"left"` | `"right-t"` |
| `|dy| > |dx|` and `dy > 0` (target is below) | `"bottom"` | `"top-t"` |
| `|dy| > |dx|` and `dy < 0` (target is above) | `"top"` | `"bottom-t"` |

### Avoid handle conflicts (mandatory)

**No two edges leaving the same node may share the same `sourceHandle`. No two edges entering the same node may share the same `targetHandle`.** Overlapping attachment points produce tangled edge starts/ends at the same pixel.

Resolution when a conflict would occur:
1. List all four faces of the conflicted node.
2. Pick the next-best face geometrically — the one whose direction is least far from the ideal vector.
3. Assign that face to the lower-priority edge (the one added later, or the one with the less critical visual path).

Work through every node that has multiple outgoing or incoming edges before writing any JSON. A simple table helps:

```
n1 outgoing: e1→top, e2→right, e3→left, e4→bottom   ✓ no conflicts
n6 incoming: e2→left-t, e8→top-t, e11→bottom-t       ✓ no conflicts
```

Branching edges (`branchingEdges`) do not use `sourceHandle`/`targetHandle` — omit those fields on branching edge entries.

---

## Step 5 — Output the JSON

Output the complete `MapData` JSON in a single code block. No prose before it; one summary line after.

```json
{
  "focusQuestion": "...",
  "nodes": [
    { "id": "n1", "label": "...", "position": { "x": 0, "y": 0 } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "label": "...", "sourceHandle": "right", "targetHandle": "left-t" }
  ],
  "branchingEdges": [],
  "notes": [
    {
      "id": "note1",
      "position": { "x": -100, "y": -70 },
      "width": 400,
      "height": 200,
      "backgroundColor": "#1e3a5f",
      "text": "Group label",
      "textSize": "small"
    }
  ]
}
```

**Validator rules — the app will reject the file if violated:**
- Every node: `id` (string), `label` (string), `position.x` and `position.y` (numbers).
- Every edge: `id`, `source`, `target` (all strings), `label` (string), `sourceHandle` (one of `"top"` `"right"` `"bottom"` `"left"`), `targetHandle` (one of `"top-t"` `"right-t"` `"bottom-t"` `"left-t"`). `source`/`target` must reference existing node IDs.
- `branchingEdges` entries: `id`, `source` (node id), `label` (string), `targets` (array of ≥ 2 node ids). Do **not** add `sourceHandle`/`targetHandle` to branching edges.
- Notes: `id`, `position.x`, `position.y`, `width`, `height` (numbers), `backgroundColor` (one of the 10 palette values above), optional `text` (string), optional `textSize` (`"small"` | `"medium"` | `"large"`).
- No duplicate IDs anywhere.

---

## Step 6 — Save and open in ConceptForge

After outputting the JSON:

**1. Determine the output path.**

If `$ARGUMENTS` contains an explicit file path (e.g. `save to /home/alice/maps/topic.json`), use it exactly.

Otherwise, resolve the default output directory at runtime — do **not** hardcode any path:

```bash
node -e "const os = require('os'); const path = require('path'); console.log(path.join(os.homedir(), 'cfcmaps'));"
```

Use the printed path as the directory and append `/<slugified-topic>.json` to form the full file path. Create the directory if it does not exist.

**2. Write the file** using the Write tool.

**3. Generate the ConceptForge autoload URL** by running this command with the Bash tool:

```bash
node -e "
const fs = require('fs');
const zlib = require('zlib');
const URL_LIMIT = 7500; // safe margin below nginx 8KB buffer
const raw = fs.readFileSync('FILEPATH', 'utf8');
const minified = JSON.stringify(JSON.parse(raw));
const compressed = zlib.deflateRawSync(Buffer.from(minified));
const b64 = compressed.toString('base64');
const local = 'http://localhost:5173/?autoload=' + encodeURIComponent(b64);
const prod  = 'https://conceptforge.fly.dev/?autoload=' + encodeURIComponent(b64);
if (prod.length > URL_LIMIT) {
  console.log('URL_TOO_LARGE: ' + prod.length + ' chars (limit ' + URL_LIMIT + ')');
} else {
  console.log('LOCAL: ' + local);
  console.log('PROD:  ' + prod);
}
"
```

Replace `FILEPATH` with the actual path written in step 2.

**4. Output the result** after the JSON block:

- If the script printed `LOCAL:` and `PROD:` lines, output both URLs:

  > **Open in ConceptForge:**
  > - Local dev: `http://localhost:5173/?autoload=...`
  > - Production: `https://conceptforge.fly.dev/?autoload=...`
  >
  > Click either URL — the map will load instantly without needing to use the Load button.

- If the script printed `URL_TOO_LARGE:`, tell the user the map is too large to share via URL and instruct them to load it using the **Load** button in ConceptForge, pointing to the file saved in step 2.

---

## Quality checklist (self-verify before writing the file)

- [ ] Map shape chosen deliberately — not defaulted to hierarchical without reason
- [ ] Every edge `source`/`target` references an existing node `id`
- [ ] No duplicate `id` values across nodes, edges, branchingEdges, or notes
- [ ] All `position.x`, `position.y`, `width`, `height` are numbers (not strings)
- [ ] Every edge has a `label`
- [ ] Every regular edge has a `sourceHandle` and `targetHandle` (branching edges: omit these fields)
- [ ] Handle faces chosen from the source→target vector table in Step 4
- [ ] No two edges leaving the same node share the same `sourceHandle`
- [ ] No two edges entering the same node share the same `targetHandle`
- [ ] `branchingEdges` entries have ≥ 2 targets
- [ ] Every note `backgroundColor` is one of the 10 palette values
- [ ] Note bounding boxes actually contain their intended nodes (min_x − 60 ≤ node.x for all group nodes)
- [ ] No note contains fewer than 2 nodes
- [ ] The map tells a coherent story — each node earns its place
- [ ] The focus question is genuinely answered by reading the map
