// Shared TypeScript contracts — source of truth for all agents
// Do not modify without updating CLAUDE.md section 5

export interface ConceptNode {
  id: string
  label: string
  position: { x: number; y: number }
  type?: 'concept' | 'question' | 'source' | 'insight'
}

export interface ConceptEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface MapData {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
}

export interface ClaudeMapResponse {
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ source: string; target: string; label?: string }>
}

export interface ExpandNodeRequest {
  nodeId: string
  nodeLabel: string
  existingNodes: ConceptNode[]
}
