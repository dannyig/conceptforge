// Claude API client
import type { ClaudeMapResponse, ExpandNodeRequest, SummaryResource } from '@/types'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

// Internal type for Mode 2 (A-13, A-15) concept suggestions
export interface ConceptSuggestion {
  id: string
  label: string
  description: string
}

// A-18: result type wrapping Mode 2 suggestions with summary data
export interface SuggestConceptsResult {
  concepts: ConceptSuggestion[]
  narrative: string
  resources: SummaryResource[]
}

// A-12: Mode 1 — generate a full concept map (nodes + edges) from a focus question
export async function generateMap(prompt: string, apiKey: string): Promise<ClaudeMapResponse> {
  const userPrompt =
    `Create a concept map for the following topic or question:\n\n"${prompt}"\n\n` +
    `Return ONLY valid JSON — no markdown, no explanation:\n` +
    `{\n` +
    `  "nodes": [\n` +
    `    { "id": "1", "label": "Main Concept", "description": "A brief 1–2 sentence definition of this concept and why it is relevant." }\n` +
    `  ],\n` +
    `  "edges": [\n` +
    `    { "source": "1", "target": "2", "label": "relates to" }\n` +
    `  ],\n` +
    `  "narrative": "A short paragraph explaining the topic and why these concepts were chosen.",\n` +
    `  "resources": [\n` +
    `    { "label": "Wikipedia — Topic Name", "url": "https://en.wikipedia.org/wiki/Topic" }\n` +
    `  ]\n` +
    `}\n\n` +
    `Rules:\n` +
    `- Generate 6–12 nodes that form a well-connected concept map\n` +
    `- Node IDs must be unique strings ("1", "2", "3", etc.)\n` +
    `- Keep node labels concise (1–4 words)\n` +
    `- Every node must include a "description" field: 1–2 sentences defining the concept and its relevance to the topic\n` +
    `- Edge labels should be short relationship phrases (1–3 words)\n` +
    `- Every node should have at least one edge connecting it to another node\n` +
    `- narrative: 2–4 sentences explaining the topic and why these specific concepts were selected\n` +
    `- resources: 3–5 real, useful online resources related to the topic (Wikipedia, official docs, reputable reference sites)\n` +
    `- Do not include markdown fences or any text outside the JSON object`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
  const text = data.content.find(c => c.type === 'text')?.text
  if (!text) throw new Error('Empty response from Claude')

  let parsed: unknown
  try {
    const cleaned = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Claude returned invalid JSON')
  }

  return parseClaudeResponse(parsed)
}

// A-13, A-14, A-15: Mode 2 — suggest concept nodes only (no edges), each with a description
// A-17, A-18: also returns narrative and resources for the summary panel
export async function suggestConcepts(
  prompt: string,
  existingLabels: string[],
  apiKey: string
): Promise<SuggestConceptsResult> {
  const exclusion =
    existingLabels.length > 0
      ? `\n\nDo NOT suggest any of these concepts already on the map: ${existingLabels.join(', ')}`
      : ''

  const userPrompt =
    `Suggest 6–10 key concepts related to the following topic or question:\n\n"${prompt}"${exclusion}\n\n` +
    `Return ONLY valid JSON — no markdown, no explanation:\n` +
    `{\n` +
    `  "concepts": [\n` +
    `    { "id": "1", "label": "Concept Name", "description": "A brief 1–2 sentence description of this concept and why it is relevant." }\n` +
    `  ],\n` +
    `  "narrative": "A short paragraph explaining the topic and why these concepts were suggested.",\n` +
    `  "resources": [\n` +
    `    { "label": "Wikipedia — Topic Name", "url": "https://en.wikipedia.org/wiki/Topic" }\n` +
    `  ]\n` +
    `}\n\n` +
    `Rules:\n` +
    `- Each concept must be a distinct, meaningful idea related to the topic\n` +
    `- Keep labels concise (1–4 words)\n` +
    `- Descriptions should be 1–2 sentences, informative but brief\n` +
    `- Node IDs must be unique strings ("1", "2", etc.)\n` +
    `- Do not include edges — nodes only\n` +
    `- narrative: 2–4 sentences explaining the topic and why these specific concepts were suggested\n` +
    `- resources: 3–5 real, useful online resources related to the topic (Wikipedia, official docs, reputable reference sites)\n` +
    `- Do not include markdown fences or any text outside the JSON object`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
  const text = data.content.find(c => c.type === 'text')?.text
  if (!text) throw new Error('Empty response from Claude')

  let parsed: unknown
  try {
    const cleaned = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Claude returned invalid JSON')
  }

  return parseConceptSuggestionsResult(parsed)
}

export async function expandNode(
  request: ExpandNodeRequest,
  apiKey: string
): Promise<ClaudeMapResponse> {
  const { nodeId, nodeLabel, nodeDescription, focusQuestion, existingNodes } = request
  const existingLabels = existingNodes.map(n => n.label).join(', ')

  let prompt = `You are expanding a concept map node. Generate 4–6 related concepts for: "${nodeLabel}".\n\n`

  if (nodeDescription) {
    prompt += `Context about this concept: ${nodeDescription}\n\n`
  }

  if (focusQuestion) {
    prompt += `The map's focus question is: "${focusQuestion}"\n\n`
  }

  prompt +=
    `Existing concepts (do not repeat these): ${existingLabels}\n\n` +
    `Return ONLY valid JSON — no markdown, no explanation:\n` +
    `{\n` +
    `  "nodes": [\n` +
    `    { "id": "n1", "label": "Concept Name" }\n` +
    `  ],\n` +
    `  "edges": [\n` +
    `    { "source": "${nodeId}", "target": "n1", "label": "relationship" }\n` +
    `  ]\n` +
    `}\n\n` +
    `Rules:\n` +
    `- New node IDs must be "n1", "n2", "n3", etc.\n` +
    `- In edges, use "${nodeId}" when connecting the expanded node to a new node\n` +
    `- Keep node labels concise (1–4 words)\n` +
    `- Edge labels should be short (1–3 words)\n` +
    `- Do not include concepts already in the map`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
  const text = data.content.find(c => c.type === 'text')?.text
  if (!text) throw new Error('Empty response from Claude')

  let parsed: unknown
  try {
    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Claude returned invalid JSON')
  }

  return parseClaudeResponse(parsed)
}

// A-29: chat message type for AI Node Chat
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// A-29, A-33: conversational chat about a concept node
// systemPromptBase is the K-09 user-configurable prompt; node context is appended on top of it.
export async function chatNode(
  nodeLabel: string,
  nodeDescription: string | undefined,
  focusQuestion: string | undefined,
  history: ChatMessage[],
  userMessage: string,
  apiKey: string,
  systemPromptBase: string
): Promise<string> {
  let systemPrompt = systemPromptBase

  systemPrompt += `\n\nYou are specifically helping the user explore the concept: "${nodeLabel}".`

  if (nodeDescription) {
    systemPrompt += `\n\nContext about this concept: ${nodeDescription}`
  }

  if (focusQuestion) {
    systemPrompt += `\n\nThe user is exploring this concept in the context of the following focus question: "${focusQuestion}"`
  }

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage },
  ]

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
  const text = data.content.find(c => c.type === 'text')?.text
  if (!text) throw new Error('Empty response from Claude')
  return text
}

// A-35: suggest labels for a directed edge — returns raw markdown string for display in reading panel
export async function suggestEdgeLabels(
  sourceLabel: string,
  sourceDescription: string | undefined,
  targetLabel: string,
  targetDescription: string | undefined,
  focusQuestion: string | undefined,
  apiKey: string,
  systemPrompt: string
): Promise<string> {
  let userPrompt = `Source concept: "${sourceLabel}"\n`
  if (sourceDescription) userPrompt += `Source description: ${sourceDescription}\n`
  userPrompt += `Target concept: "${targetLabel}"\n`
  if (targetDescription) userPrompt += `Target description: ${targetDescription}\n`
  if (focusQuestion) userPrompt += `Focus question: "${focusQuestion}"\n`
  userPrompt +=
    `\nSuggest 3–5 concise, directionally accurate labels for the edge from ` +
    `"${sourceLabel}" to "${targetLabel}".\n\n` +
    `Format your response exactly as follows:\n` +
    `First, an ASCII relationship diagram on its own line:\n` +
    `[${sourceLabel}] -- ? --> [${targetLabel}]\n\n` +
    `Then a numbered list of 3–5 candidate labels. For each, write the label on its own line ` +
    `followed by a short paragraph explaining why it accurately describes the directed relationship.`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
  const text = data.content.find(c => c.type === 'text')?.text
  if (!text) throw new Error('Empty response from Claude')
  return text
}

// A-36: explain an existing edge label — returns raw markdown string for display in reading panel
export async function explainEdgeLabel(
  edgeLabel: string,
  sourceLabel: string,
  sourceDescription: string | undefined,
  targetLabel: string,
  targetDescription: string | undefined,
  focusQuestion: string | undefined,
  apiKey: string,
  systemPrompt: string
): Promise<string> {
  let userPrompt = `Edge: [${sourceLabel}] -- ${edgeLabel} --> [${targetLabel}]\n`
  if (sourceDescription) userPrompt += `Source description: ${sourceDescription}\n`
  if (targetDescription) userPrompt += `Target description: ${targetDescription}\n`
  if (focusQuestion) userPrompt += `Focus question: "${focusQuestion}"\n`
  userPrompt += `\nExplain this relationship label in context.`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
  const text = data.content.find(c => c.type === 'text')?.text
  if (!text) throw new Error('Empty response from Claude')
  return text
}

export function parseClaudeResponse(raw: unknown): ClaudeMapResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid Claude response: expected an object')
  }
  const r = raw as Record<string, unknown>

  if (!Array.isArray(r.nodes)) throw new Error('Invalid response: "nodes" must be an array')
  if (!Array.isArray(r.edges)) throw new Error('Invalid response: "edges" must be an array')

  const nodes = (r.nodes as unknown[]).map((n: unknown, i: number) => {
    if (typeof n !== 'object' || n === null) throw new Error(`Node ${i}: not an object`)
    const node = n as Record<string, unknown>
    if (typeof node.id !== 'string' || !node.id)
      throw new Error(`Node ${i}: "id" must be a non-empty string`)
    if (typeof node.label !== 'string' || !node.label)
      throw new Error(`Node ${i}: "label" must be a non-empty string`)
    return {
      id: node.id,
      label: node.label,
      description: typeof node.description === 'string' ? node.description : undefined,
    }
  })

  const edges = (r.edges as unknown[]).map((e: unknown, i: number) => {
    if (typeof e !== 'object' || e === null) throw new Error(`Edge ${i}: not an object`)
    const edge = e as Record<string, unknown>
    if (typeof edge.source !== 'string' || !edge.source)
      throw new Error(`Edge ${i}: "source" must be a non-empty string`)
    if (typeof edge.target !== 'string' || !edge.target)
      throw new Error(`Edge ${i}: "target" must be a non-empty string`)
    return {
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === 'string' ? edge.label : undefined,
    }
  })

  const narrative = typeof r.narrative === 'string' ? r.narrative : ''
  const resources = parseSummaryResources(r.resources)

  return {
    nodes,
    edges,
    narrative: narrative || undefined,
    resources: resources.length ? resources : undefined,
  }
}

function parseSummaryResources(raw: unknown): SummaryResource[] {
  if (!Array.isArray(raw)) return []
  return (raw as unknown[]).flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return []
    const r = item as Record<string, unknown>
    if (typeof r.label !== 'string' || typeof r.url !== 'string') return []
    return [{ label: r.label, url: r.url }]
  })
}

function parseConceptSuggestionsResult(raw: unknown): SuggestConceptsResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid concept suggestions response: expected an object')
  }
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.concepts)) {
    throw new Error('Invalid response: "concepts" must be an array')
  }
  const concepts = (r.concepts as unknown[]).map((c: unknown, i: number) => {
    if (typeof c !== 'object' || c === null) throw new Error(`Concept ${i}: not an object`)
    const concept = c as Record<string, unknown>
    if (typeof concept.id !== 'string' || !concept.id)
      throw new Error(`Concept ${i}: "id" must be a non-empty string`)
    if (typeof concept.label !== 'string' || !concept.label)
      throw new Error(`Concept ${i}: "label" must be a non-empty string`)
    if (typeof concept.description !== 'string')
      throw new Error(`Concept ${i}: "description" must be a string`)
    return {
      id: concept.id,
      label: concept.label,
      description: concept.description,
    }
  })
  const narrative = typeof r.narrative === 'string' ? r.narrative : ''
  const resources = parseSummaryResources(r.resources)
  return { concepts, narrative, resources }
}
