import { generateMap } from '@/lib/claude'

// Regression coverage for parseJsonResponse's prose-recovery fallback (fix/opus-5-invalid-json-response-parsing):
// Opus-class models occasionally add a conversational lead-in/trailer around the requested JSON
// object despite "Return ONLY JSON" instructions. Sonnet does this far less often, which is why
// the bug surfaced as "works on Sonnet 5, fails on Opus 5" even though the parsing code is
// identical for every model.

function mockClaudeTextResponse(text: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text }] }),
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
})
