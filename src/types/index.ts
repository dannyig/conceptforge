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
  sourceHandle?: string | null // which side handle the edge originates from
  targetHandle?: string | null // which side handle the edge terminates at
  label?: string
  labelPosition?: { x: number; y: number } // C-22: custom waypoint position; absent when at default midpoint
}

export interface BranchingEdge {
  id: string
  source: string // source node ID
  label: string // shared relationship label
  targets: string[] // ordered list of target node IDs
  labelPosition?: { x: number; y: number } // draggable hub position; C-17
}

export interface NoteData {
  id: string
  position: { x: number; y: number }
  width: number
  height: number
  backgroundColor: string // one of the 10 predefined palette values (G-05)
  text?: string // absent when note has no text
  textSize?: 'small' | 'medium' | 'large' // G-06; absent = medium default
}

export interface MapData {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  branchingEdges?: BranchingEdge[] // C-13: fan-out edges; absent on maps with none
  notes?: NoteData[] // G-10: canvas notes/groups; absent when map has none
  focusQuestion?: string // F-05: persisted with the map; undefined when not set
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
