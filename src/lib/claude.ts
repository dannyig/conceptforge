// Claude API client
import type { ClaudeMapResponse, ExpandNodeRequest } from '@/types'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

export async function generateMap(_prompt: string, _apiKey: string): Promise<ClaudeMapResponse> {
  throw new Error('Not implemented — AI Agent will implement this (A-01 to A-05)')
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
    return { id: node.id, label: node.label }
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

  return { nodes, edges }
}
