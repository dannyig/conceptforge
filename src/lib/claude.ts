// Claude API client — stub only
// Implemented by AI Agent (agentspecs/03-ai-agent.md)
import type { ClaudeMapResponse, ExpandNodeRequest } from '@/types'

export async function generateMap(_prompt: string, _apiKey: string): Promise<ClaudeMapResponse> {
  throw new Error('Not implemented — AI Agent will implement this')
}

export async function expandNode(
  _request: ExpandNodeRequest,
  _apiKey: string
): Promise<ClaudeMapResponse> {
  throw new Error('Not implemented — AI Agent will implement this')
}

export function parseClaudeResponse(_raw: unknown): ClaudeMapResponse {
  throw new Error('Not implemented — AI Agent will implement this')
}
