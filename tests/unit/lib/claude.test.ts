import { generateMap } from '@/lib/claude'

// Regression coverage for two related fixes to Claude JSON response parsing:
// - fix/opus-5-invalid-json-response-parsing: models occasionally add a conversational
//   lead-in/trailer around the requested JSON object despite "Return ONLY JSON" instructions.
// - fix/generate-map-max-tokens-truncation: the actual root cause of the reported bug — the
//   2048 max_tokens cap on generateMap was too tight for a 6–12 node map with descriptions,
//   narrative, and resources, so Claude's response was cut off mid-object (stop_reason:
//   "max_tokens") with no closing brace to recover. This is what "invalid JSON" turned out to
//   mean in practice, and it was model-agnostic — any model could hit the same token ceiling.

function mockClaudeTextResponse(text: string, stopReason = 'end_turn'): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text }], stop_reason: stopReason }),
    })
  )
}

const VALID_MAP_JSON = JSON.stringify({
  nodes: [{ id: '1', label: 'Concept A' }],
  edges: [],
})

describe('generateMap JSON parsing', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses a clean JSON response', async () => {
    mockClaudeTextResponse(VALID_MAP_JSON)
    const result = await generateMap('topic', 'test-key')
    expect(result.nodes).toHaveLength(1)
  })

  it('parses a response wrapped in markdown fences', async () => {
    mockClaudeTextResponse('```json\n' + VALID_MAP_JSON + '\n```')
    const result = await generateMap('topic', 'test-key')
    expect(result.nodes).toHaveLength(1)
  })

  it('recovers JSON preceded by conversational prose (Opus-style preamble)', async () => {
    mockClaudeTextResponse(`Here's a concept map for that topic:\n\n${VALID_MAP_JSON}`)
    const result = await generateMap('topic', 'test-key')
    expect(result.nodes).toHaveLength(1)
  })

  it('recovers JSON followed by trailing commentary', async () => {
    mockClaudeTextResponse(`${VALID_MAP_JSON}\n\nLet me know if you'd like more detail!`)
    const result = await generateMap('topic', 'test-key')
    expect(result.nodes).toHaveLength(1)
  })

  it('throws when the response contains no recoverable JSON object', async () => {
    mockClaudeTextResponse('I was unable to generate a concept map for that topic.')
    await expect(generateMap('topic', 'test-key')).rejects.toThrow(
      'Claude returned invalid JSON'
    )
  })

  it('throws a distinct truncation error when stop_reason is max_tokens', async () => {
    // Simulates the actual reported bug: a well-formed-looking but incomplete JSON body,
    // cut off mid-object because the response hit the token cap.
    mockClaudeTextResponse('{"nodes": [{"id": "1", "label": "Concept A", "descrip', 'max_tokens')
    await expect(generateMap('topic', 'test-key')).rejects.toThrow(/cut off/)
  })
})
