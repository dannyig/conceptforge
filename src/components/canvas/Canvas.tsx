import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type FinalConnectionState,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { BranchArrowEdge } from './BranchArrowEdge'
import { BranchHubNode } from './BranchHubNode'
import { BranchStemEdge } from './BranchStemEdge'
import { ConceptEdge } from './ConceptEdge'
import { ConceptNode } from './ConceptNode'
import { NoteNode } from './NoteNode'
import type { BranchingEdge, ConceptNode as ConceptNodeType, MapData, NoteData } from '@/types'
import {
  BG_DOT_GAP,
  BG_DOT_SIZE,
  COLOR_BG_DOT,
  COLOR_CANVAS_BG,
  COLOR_CONTROLS_BG,
  COLOR_CONTROLS_BORDER,
  COLOR_CONTROLS_HOVER_BG,
  COLOR_CONTROLS_TEXT,
  COLOR_EDGE,
  COLOR_EDGE_SELECTED,
  COLOR_MINIMAP_BORDER,
  COLOR_MINIMAP_MASK,
  COLOR_NODE_BG,
  COLOR_NODE_BORDER,
  COLOR_NODE_SELECTED,
  COLOR_NODE_TEXT,
  FONT_FAMILY,
  FONT_SIZE_NODE_LABEL,
  NOTE_COLORS,
  NOTE_DEFAULT_COLOR,
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_WIDTH,
  NOTE_TEXT_SIZES,
  TICKER_HEIGHT,
  TRANSITION_FAST,
  FONT_WEIGHT_NODE_LABEL,
  COLOR_TEXT_MUTED,
  COLOR_STATUS_ERROR,
  FIT_VIEW_DURATION_MS,
  COLOR_THINKING_BORDER_DEEP,
  COLOR_THINKING_BORDER_SKY,
  THINKING_BORDER_DURATION_MS,
} from '@/lib/theme'
import { expandNode, suggestEdgeConcepts, suggestEdgeLabels, explainEdgeLabel } from '@/lib/claude'
import { getApiKey, OPEN_SETTINGS_EVENT } from '@/lib/apiKey'
import { getEdgeLabelPrompt } from '@/lib/edgeLabelPrompts'
import { ChatReadingPanel } from '@/components/ai/ChatReadingPanel'
import { SuggestionSelectPanel, type SuggestionItem } from '@/components/ai/SuggestionSelectPanel'

// Canvas-internal node data — superset of concept-node, branch-hub, and note data
type CanvasNodeData = {
  label: string
  conceptType?: 'concept' | 'question' | 'source' | 'insight'
  branchingEdgeId?: string
  autoEdit?: boolean
  // G-01→G-10: note-specific fields (only present when type === 'note')
  backgroundColor?: string
  text?: string
  textSize?: 'small' | 'medium' | 'large'
  description?: string // C-28: short freeform description
}
type CanvasFlowNode = Node<CanvasNodeData>

// Canvas-internal edge data
type CanvasEdgeData = {
  label?: string
  labelPosition?: { x: number; y: number }
  branchingEdgeId?: string
  isStem?: boolean
  isBranch?: boolean
  isHovered?: boolean // C-32: injected by computedEdges; not persisted
}
type CanvasFlowEdge = Edge<CanvasEdgeData>

// Returns the best target handle ID for an edge arriving at `target` from `source`.
// Picks the face that most directly faces the source node.
function pickTargetHandle(
  source: { x: number; y: number },
  target: { x: number; y: number }
): string {
  const dx = target.x - source.x
  const dy = target.y - source.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'left-t' : 'right-t'
  }
  return dy >= 0 ? 'top-t' : 'bottom-t'
}

// Returns the best source handle ID for an edge leaving `source` toward `target`.
// Mirror of pickTargetHandle — picks the face that most directly faces the target node.
function pickSourceHandle(
  source: { x: number; y: number },
  target: { x: number; y: number }
): string {
  const dx = target.x - source.x
  const dy = target.y - source.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left'
  }
  return dy >= 0 ? 'bottom' : 'top'
}

// ID helpers — pure functions at module scope
function hubNodeId(beId: string): string {
  return `hub-${beId}`
}
function stemEdgeId(beId: string): string {
  return `stem-${beId}`
}
function branchEdgeId(beId: string, targetId: string): string {
  return `branch-${beId}-${targetId}`
}

// Arrow direction vectors — used for keyboard navigation (C-34–C-38)
const ARROW_DIRS: Record<string, { dx: number; dy: number }> = {
  ArrowRight: { dx: 1, dy: 0 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowUp: { dx: 0, dy: -1 },
}
// Degrees to which a neighbour can deviate from the arrow axis and still be "in that direction"
const NUDGE_STEP = 2 // px — matches React Flow's default keyboard nudge (C-38)

// Smallest angular distance between two angles (result in [0, π])
function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % (Math.PI * 2)
  return d > Math.PI ? Math.PI * 2 - d : d
}

// Stable type-map references — must live outside the component to avoid RF re-renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_TYPES: Record<string, React.ComponentType<any>> = {
  concept: ConceptNode,
  branchHub: BranchHubNode,
  note: NoteNode,
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: Record<string, React.ComponentType<any>> = {
  default: ConceptEdge,
  branchStem: BranchStemEdge,
  branchArrow: BranchArrowEdge,
}
const MARKER_END_DEFAULT = {
  type: MarkerType.ArrowClosed,
  color: COLOR_EDGE,
  width: 22,
  height: 22,
}
const MARKER_END_SELECTED = {
  type: MarkerType.ArrowClosed,
  color: COLOR_EDGE_SELECTED,
  width: 22,
  height: 22,
}

const DEFAULT_EDGE_OPTIONS = {
  markerEnd: MARKER_END_DEFAULT,
  style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
}

export interface CanvasHandle {
  getMapData: () => MapData
  setMapData: (data: MapData) => void
  appendConceptNodes: (nodes: ConceptNodeType[]) => void
}

interface CanvasFlowProps {
  ref?: React.Ref<CanvasHandle>
  onNodeCountChange?: (count: number) => void
  focusQuestion?: string
  aiAssistEnabled?: boolean
  onChatNode?: (nodeId: string, nodeLabel: string, nodeDescription?: string) => void
}

// Fan-position new nodes in an arc below/around the source node (A-07)
function fanPositions(
  source: { x: number; y: number },
  count: number
): Array<{ x: number; y: number }> {
  const RADIUS = 220
  const SPREAD = (Math.PI * 2) / 3 // 120-degree arc
  const CENTER = Math.PI / 2 // pointing downward in canvas coordinates
  if (count === 1) return [{ x: source.x, y: source.y + RADIUS }]
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(source.x + Math.cos(CENTER - SPREAD / 2 + (i / (count - 1)) * SPREAD) * RADIUS),
    y: Math.round(source.y + Math.sin(CENTER - SPREAD / 2 + (i / (count - 1)) * SPREAD) * RADIUS),
  }))
}

// Inner component — must be inside ReactFlowProvider to use useReactFlow
function CanvasFlow({
  ref,
  onNodeCountChange,
  focusQuestion = '',
  aiAssistEnabled = true,
  onChatNode,
}: CanvasFlowProps): React.JSX.Element {
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasFlowEdge>([])

  // Stable refs so callbacks never close over stale state
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect((): void => {
    nodesRef.current = nodes
  }, [nodes])
  useEffect((): void => {
    edgesRef.current = edges
  }, [edges])
  useEffect((): void => {
    onNodeCountChange?.(nodes.filter(n => n.type === 'concept').length)
  }, [nodes, onNodeCountChange])

  // C-32: track which edge the cursor is currently over for the orange-label hover cue.
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

  const onEdgeMouseEnter = useCallback((_event: React.MouseEvent, edge: CanvasFlowEdge): void => {
    if (!edge.data?.isStem) setHoveredEdgeId(edge.id)
  }, [])

  const onEdgeMouseLeave = useCallback((): void => {
    setHoveredEdgeId(null)
  }, [])

  // C-31/C-32/C-33: non-stem edges are always reconnectable at their target endpoint.
  // Gating reconnectable on edge.selected caused a React Flow timing bug: the reconnect
  // handle is initialised on mouseenter, so changing reconnectable while the cursor is
  // already over the edge meant the handle never appeared for that hover session.
  // C-32 hover cue (orange label) is suppressed while a C-33 click-selection is active —
  // when an edge is click-selected it is the sole orange edge until click-on-canvas or Escape.
  const hasClickSelectedEdge = useMemo(
    () => edges.some(e => e.selected === true && !e.data?.isStem),
    [edges]
  )

  const computedEdges = useMemo((): CanvasFlowEdge[] => {
    return edges.map(edge => {
      const reconnectable = !edge.data?.isStem ? ('target' as const) : false
      // Suppress hover cue when a click-selection is active (C-33 takes precedence over C-32).
      const isHovered = edge.id === hoveredEdgeId && !edge.data?.isStem && !hasClickSelectedEdge
      // Selected non-stem edges get a larger orange arrowhead to mark the reconnect endpoint.
      const markerEnd =
        edge.selected && !edge.data?.isStem ? MARKER_END_SELECTED : MARKER_END_DEFAULT

      // C-11/C-17: BranchStemEdge and BranchArrowEdge compute the free-form boundary
      // intersection themselves via useInternalNode — no handle override needed here.

      const reconnectableChanged = edge.reconnectable !== reconnectable
      const hoverChanged = !!edge.data?.isHovered !== isHovered
      // Also check markerEnd: RF's batch queue can bake computed markerEnd back into edges
      // state via "replace" changes, so we must detect a stale value here too.
      const markerEndChanged = edge.markerEnd !== markerEnd
      if (!reconnectableChanged && !hoverChanged && !markerEndChanged) return edge
      return {
        ...edge,
        reconnectable,
        markerEnd,
        data: hoverChanged ? { ...edge.data, isHovered } : edge.data,
      }
    })
  }, [edges, hasClickSelectedEdge, hoveredEdgeId])

  const [contextMenu, setContextMenu] = useState<{
    edgeId: string
    edgeLabel: string | undefined
    sourceNodeId: string
    targetNodeId: string
    x: number
    y: number
  } | null>(null)

  // A-38: hub right-click menu state
  const [hubMenu, setHubMenu] = useState<{
    hubNodeId: string
    x: number
    y: number
  } | null>(null)

  // A-35/A-36/A-40/A-41: edge label AI panel state
  const [edgeLabelPanel, setEdgeLabelPanel] = useState<{
    title: string
    content: string
    type: 'explainLabel' | 'suggestLabels' | 'suggestConcepts'
    edgeId?: string // suggestLabels: edge to update; suggestConcepts from single edge
    sourceNodeId?: string // suggestConcepts from single edge: source node
    hubNodeId?: string // suggestConcepts from hub: hub node
  } | null>(null)
  const [edgeLabelLoading, setEdgeLabelLoading] = useState(false)
  const [edgeLabelError, setEdgeLabelError] = useState<string | null>(null)

  // G-01: pane right-click menu state
  const [paneMenu, setPaneMenu] = useState<{
    x: number
    y: number
    flowX: number
    flowY: number
  } | null>(null)

  // G-11: note right-click menu state — main (4 actions) or edit (colour + text size)
  const [noteMenu, setNoteMenu] = useState<{
    nodeId: string
    x: number
    y: number
    flowX: number
    flowY: number
    mode: 'main' | 'edit'
  } | null>(null)

  // C-23: selection mode toggle — when active, drag draws a rubber-band selection rectangle
  const [selectionMode, setSelectionMode] = useState(false)
  // C-25: track whether Space is held so drag can temporarily pan while in select mode
  const [spacePanning, setSpacePanning] = useState(false)

  // C-28: concept node right-click menu state
  const [nodeMenu, setNodeMenu] = useState<{
    nodeId: string
    x: number
    y: number
  } | null>(null)

  // C-28: description edit popover state
  const [nodeInfoEdit, setNodeInfoEdit] = useState<{
    nodeId: string
    x: number
    y: number
    draft: string
  } | null>(null)
  // Ref used to cancel save when Escape is pressed before onBlur fires
  const nodeInfoCancelledRef = useRef(false)

  // A-06–A-10: node expansion state
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null)
  const [expandError, setExpandError] = useState<string | null>(null)

  const closeAllMenus = useCallback((): void => {
    setContextMenu(null)
    setHubMenu(null)
    setPaneMenu(null)
    setNoteMenu(null)
    setNodeMenu(null)
  }, [])

  // ---------- imperative handle (Persistence Agent) ----------

  useImperativeHandle(
    ref,
    (): CanvasHandle => ({
      getMapData: (): MapData => {
        const ns = nodesRef.current
        const es = edgesRef.current
        const beMap = new Map<string, BranchingEdge>()
        for (const n of ns) {
          if (n.type === 'branchHub' && n.data.branchingEdgeId) {
            beMap.set(n.data.branchingEdgeId, {
              id: n.data.branchingEdgeId,
              source: '',
              label: n.data.label,
              targets: [],
              labelPosition: n.position,
            })
          }
        }
        for (const e of es) {
          if (e.data?.isStem && e.data.branchingEdgeId) {
            const be = beMap.get(e.data.branchingEdgeId)
            if (be) be.source = e.source
          }
          if (e.data?.isBranch && e.data.branchingEdgeId) {
            const be = beMap.get(e.data.branchingEdgeId)
            if (be) be.targets.push(e.target)
          }
        }
        const noteNodes = ns.filter(n => n.type === 'note')
        const notes: NoteData[] = noteNodes.map(
          (n): NoteData => ({
            id: n.id,
            position: n.position,
            width: typeof n.style?.width === 'number' ? n.style.width : NOTE_DEFAULT_WIDTH,
            height: typeof n.style?.height === 'number' ? n.style.height : NOTE_DEFAULT_HEIGHT,
            backgroundColor: n.data.backgroundColor ?? NOTE_DEFAULT_COLOR,
            text: n.data.text,
            textSize: n.data.textSize,
          })
        )
        return {
          nodes: ns
            .filter(n => n.type !== 'branchHub' && n.type !== 'note')
            .map(
              (n): ConceptNodeType => ({
                id: n.id,
                label: n.data.label,
                position: n.position,
                type: n.data.conceptType,
                description: n.data.description || undefined,
              })
            ),
          edges: es
            .filter(e => !e.data?.isStem && !e.data?.isBranch)
            .map(e => ({
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle ?? null,
              targetHandle: e.targetHandle ?? null,
              label: e.data?.label,
              labelPosition: e.data?.labelPosition,
            })),
          branchingEdges: beMap.size > 0 ? [...beMap.values()] : undefined,
          notes: notes.length > 0 ? notes : undefined,
        }
      },

      setMapData: (data: MapData): void => {
        const newNodes: CanvasFlowNode[] = data.nodes.map(n => ({
          id: n.id,
          type: 'concept' as const,
          position: n.position,
          data: { label: n.label, conceptType: n.type, description: n.description },
        }))
        const newEdges: CanvasFlowEdge[] = data.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
          data: { label: e.label, labelPosition: e.labelPosition },
          markerEnd: MARKER_END_DEFAULT,
          style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
        }))
        if (data.branchingEdges) {
          for (const be of data.branchingEdges) {
            const hub = hubNodeId(be.id)
            const hubPos = be.labelPosition ?? { x: 0, y: 0 }
            newNodes.push({
              id: hub,
              type: 'branchHub' as const,
              position: hubPos,
              data: { label: be.label, branchingEdgeId: be.id },
            })
            const srcNode = newNodes.find(n => n.id === be.source)
            const stemSourceHandle = srcNode ? pickSourceHandle(srcNode.position, hubPos) : null
            newEdges.push({
              id: stemEdgeId(be.id),
              source: be.source,
              sourceHandle: stemSourceHandle,
              target: hub,
              type: 'branchStem',
              data: { branchingEdgeId: be.id, isStem: true },
            })
            for (const targetId of be.targets) {
              newEdges.push({
                id: branchEdgeId(be.id, targetId),
                source: hub,
                target: targetId,
                type: 'branchArrow',
                data: { branchingEdgeId: be.id, isBranch: true },
                markerEnd: MARKER_END_DEFAULT,
                style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
              })
            }
          }
        }
        // G-10: restore notes — G-02: zIndex:-1 invariant
        if (data.notes) {
          for (const note of data.notes) {
            newNodes.push({
              id: note.id,
              type: 'note' as const,
              position: note.position,
              style: { width: note.width, height: note.height },
              zIndex: -1,
              data: {
                label: '',
                backgroundColor: note.backgroundColor,
                text: note.text,
                textSize: note.textSize,
              },
            })
          }
        }
        setNodes(newNodes)
        setEdges(newEdges)
        // V-08 / A-25: fit once after map load; setTimeout lets React flush the new nodes first
        setTimeout((): void => {
          fitView({ padding: 0.15, maxZoom: 1, duration: FIT_VIEW_DURATION_MS })
        }, 50)
      },

      // A-13: append concept nodes (with descriptions) without replacing existing canvas content
      appendConceptNodes: (newConceptNodes: ConceptNodeType[]): void => {
        setNodes(nds => [
          ...nds,
          ...newConceptNodes.map(n => ({
            id: n.id,
            type: 'concept' as const,
            position: n.position,
            data: {
              label: n.label,
              conceptType: n.type,
              description: n.description,
            },
          })),
        ])
        // A-25: fit to view after new nodes land
        setTimeout((): void => {
          fitView({ padding: 0.15, maxZoom: 1, duration: FIT_VIEW_DURATION_MS })
        }, 50)
      },
    }),
    [setNodes, setEdges, fitView]
  )

  // ---------- C-10: convert labelled edge → branching edge ----------

  const convertToBranchingEdge = useCallback(
    (edgeId: string): void => {
      setContextMenu(null)
      const edge = edgesRef.current.find(e => e.id === edgeId)
      if (!edge) return
      const beId = crypto.randomUUID()
      const hub = hubNodeId(beId)
      const label = edge.data?.label ?? ''
      const sn = nodesRef.current.find(n => n.id === edge.source)
      const tn = nodesRef.current.find(n => n.id === edge.target)
      const hubX = sn && tn ? (sn.position.x + tn.position.x) / 2 - 20 : 100
      const hubY = sn && tn ? (sn.position.y + tn.position.y) / 2 - 12 : 100
      setNodes(nds => [
        ...nds,
        {
          id: hub,
          type: 'branchHub' as const,
          position: { x: hubX, y: hubY },
          data: { label, branchingEdgeId: beId },
        },
      ])
      setEdges(eds => [
        ...eds.filter(e => e.id !== edgeId),
        {
          id: stemEdgeId(beId),
          source: edge.source,
          sourceHandle: edge.sourceHandle ?? null,
          target: hub,
          type: 'branchStem',
          data: { branchingEdgeId: beId, isStem: true },
        },
        {
          id: branchEdgeId(beId, edge.target),
          source: hub,
          target: edge.target,
          targetHandle: edge.targetHandle ?? null,
          type: 'branchArrow',
          data: { branchingEdgeId: beId, isBranch: true },
          markerEnd: MARKER_END_DEFAULT,
          style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
        },
      ])
    },
    [setNodes, setEdges]
  )

  // ---------- onConnect: regular edges + hub → target branches (C-12) ----------

  const onConnect = useCallback(
    (params: Connection): void => {
      if (params.source === params.target) return
      const sourceNode = nodesRef.current.find(n => n.id === params.source)
      if (sourceNode?.type === 'branchHub' && sourceNode.data.branchingEdgeId) {
        const beId = sourceNode.data.branchingEdgeId
        const targetId = params.target
        if (!targetId) return
        if (
          edgesRef.current.some(
            e => e.data?.isBranch && e.data?.branchingEdgeId === beId && e.target === targetId
          )
        )
          return
        setEdges(eds => [
          ...eds,
          {
            id: branchEdgeId(beId, targetId),
            source: params.source ?? '',
            target: targetId,
            type: 'branchArrow',
            data: { branchingEdgeId: beId, isBranch: true },
            markerEnd: MARKER_END_DEFAULT,
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          },
        ])
        return
      }
      setEdges(eds =>
        addEdge(
          {
            ...params,
            id: crypto.randomUUID(),
            data: { label: '?' },
            markerEnd: MARKER_END_DEFAULT,
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          },
          eds
        )
      )
    },
    [setEdges]
  )

  // ---------- onConnectEnd: drag hub → empty canvas creates new node (C-12) ----------

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState): void => {
      if (connectionState.isValid) return
      // FinalConnectionState shape uses fromHandle (not startHandle) in @xyflow/react v12
      const state = connectionState as unknown as {
        fromHandle?: { nodeId?: string; id?: string } | null
      }
      const fromNodeId = state.fromHandle?.nodeId
      const fromHandleId = state.fromHandle?.id ?? null
      if (!fromNodeId) return
      // C-31: suppress new-node creation when a reconnect drag ends on empty canvas.
      // Primary guard: reconnectInProgressRef is set by onReconnectStart and cleared
      // by onReconnectEnd — more reliable than inspecting handle IDs.
      // Secondary guard: target handles end in "-t"; keep as belt-and-suspenders.
      if (reconnectInProgressRef.current || fromHandleId?.endsWith('-t')) return
      const fromNode = nodesRef.current.find(n => n.id === fromNodeId)
      const clientX =
        'clientX' in event ? event.clientX : ((event as TouchEvent).touches[0]?.clientX ?? 0)
      const clientY =
        'clientY' in event ? event.clientY : ((event as TouchEvent).touches[0]?.clientY ?? 0)
      const position = screenToFlowPosition({ x: clientX, y: clientY })

      if (fromNode?.type === 'branchHub' && fromNode.data.branchingEdgeId) {
        // C-12: hub drag → empty canvas creates new branch target
        const beId = fromNode.data.branchingEdgeId
        const newNodeId = crypto.randomUUID()
        setNodes(nds => [
          ...nds,
          {
            id: newNodeId,
            type: 'concept' as const,
            position,
            data: { label: 'New concept', conceptType: 'concept' as const },
          },
        ])
        setEdges(eds => [
          ...eds,
          {
            id: branchEdgeId(beId, newNodeId),
            source: fromNodeId,
            target: newNodeId,
            type: 'branchArrow',
            data: { branchingEdgeId: beId, isBranch: true },
            markerEnd: MARKER_END_DEFAULT,
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          },
        ])
        return
      }

      if (fromNode?.type === 'concept') {
        // C-19: concept node drag → empty canvas creates new connected node in edit mode
        const newNodeId = crypto.randomUUID()
        setNodes(nds => [
          ...nds,
          {
            id: newNodeId,
            type: 'concept' as const,
            position,
            data: { label: '', conceptType: 'concept' as const, autoEdit: true },
          },
        ])
        setEdges(eds => [
          ...eds,
          {
            id: crypto.randomUUID(),
            source: fromNodeId,
            sourceHandle: fromHandleId,
            target: newNodeId,
            targetHandle: pickTargetHandle(fromNode.position, position),
            type: 'default',
            data: { label: '?' },
            markerEnd: MARKER_END_DEFAULT,
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          },
        ])
      }
    },
    [screenToFlowPosition, setNodes, setEdges]
  )

  // ---------- C-31: reconnect target endpoint of an edge to a different node handle ----------

  // Ref tracks whether a reconnect drag is in progress so onConnectEnd can skip
  // new-node creation. The "-t" handle-ID guard alone is unreliable because
  // fromHandle.id can be null during a reconnect drag.
  const reconnectInProgressRef = useRef(false)

  const onReconnectStart = useCallback((): void => {
    reconnectInProgressRef.current = true
  }, [])

  const onReconnectEndCb = useCallback((): void => {
    reconnectInProgressRef.current = false
  }, [])

  const onReconnect = useCallback(
    (oldEdge: CanvasFlowEdge, newConnection: Connection): void => {
      setEdges(eds => {
        // Use the stored edge (not the computed one) so injected markerEnd/isHovered don't
        // get baked into persistent state when reconnectEdge spreads oldEdge as its base.
        const storedEdge = eds.find(e => e.id === oldEdge.id) ?? oldEdge
        return reconnectEdge(storedEdge, newConnection, eds)
      })
    },
    [setEdges]
  )

  // ---------- handleNodesChange: hub deletion removes entire group (C-16) ----------

  const handleNodesChange = useCallback(
    (changes: NodeChange<CanvasFlowNode>[]): void => {
      const hubRemovals = changes.filter(
        (c): c is { type: 'remove'; id: string } =>
          c.type === 'remove' && nodesRef.current.find(n => n.id === c.id)?.type === 'branchHub'
      )
      if (hubRemovals.length > 0) {
        const beIds = new Set<string>()
        for (const c of hubRemovals) {
          const beId = nodesRef.current.find(n => n.id === c.id)?.data.branchingEdgeId
          if (beId) beIds.add(beId)
        }
        setEdges(eds =>
          eds.filter(e => !e.data?.branchingEdgeId || !beIds.has(e.data.branchingEdgeId))
        )
      }
      onNodesChange(changes)
    },
    [onNodesChange, setEdges]
  )

  // ---------- handleEdgesChange: stem/branch delete semantics (C-14, C-16) ----------

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<CanvasFlowEdge>[]): void => {
      for (const change of changes) {
        if (change.type !== 'remove') continue
        const edge = edgesRef.current.find(e => e.id === change.id)
        if (!edge) continue

        if (edge.data?.isStem && edge.data.branchingEdgeId) {
          // Deleting the stem removes the whole group; target nodes stay (C-16)
          const beId = edge.data.branchingEdgeId
          setNodes(nds => nds.filter(n => n.id !== hubNodeId(beId)))
          setEdges(eds => eds.filter(e => e.data?.branchingEdgeId !== beId))
          return
        }

        if (edge.data?.isBranch && edge.data.branchingEdgeId) {
          const beId = edge.data.branchingEdgeId
          const remaining = edgesRef.current.filter(
            e => e.data?.isBranch && e.data?.branchingEdgeId === beId && e.id !== edge.id
          )
          if (remaining.length === 0) {
            // Last branch — clean up entire group
            setNodes(nds => nds.filter(n => n.id !== hubNodeId(beId)))
            setEdges(eds => eds.filter(e => e.data?.branchingEdgeId !== beId))
            return
          }
          if (remaining.length === 1) {
            // C-14: one target left — revert to a plain ConceptEdge
            const lastBranch = remaining[0]
            const stem = edgesRef.current.find(
              e => e.data?.isStem && e.data?.branchingEdgeId === beId
            )
            const hubNode = nodesRef.current.find(n => n.id === hubNodeId(beId))
            if (stem && lastBranch && hubNode) {
              setNodes(nds => nds.filter(n => n.id !== hubNodeId(beId)))
              setEdges(eds => [
                ...eds.filter(e => e.data?.branchingEdgeId !== beId),
                {
                  id: crypto.randomUUID(),
                  source: stem.source,
                  sourceHandle: stem.sourceHandle ?? null,
                  target: lastBranch.target,
                  targetHandle: lastBranch.targetHandle ?? null,
                  type: 'default',
                  data: { label: hubNode.data.label },
                  markerEnd: MARKER_END_DEFAULT,
                  style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
                },
              ])
              return
            }
          }
          // More than one branch remains — fall through to normal removal
        }
      }
      onEdgesChange(changes)
    },
    [onEdgesChange, setNodes, setEdges]
  )

  // ---------- right-click on edge label → "Branch" context menu (C-10) ----------

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: CanvasFlowEdge): void => {
      event.preventDefault()
      if (edge.data?.isStem || edge.data?.isBranch) return
      closeAllMenus()
      setContextMenu({
        edgeId: edge.id,
        edgeLabel: edge.data?.label || undefined,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        x: event.clientX,
        y: event.clientY,
      })
    },
    [closeAllMenus]
  )

  // ---------- G-01: right-click on pane → "Add Node" / "Add Note" ----------

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent): void => {
      event.preventDefault()
      closeAllMenus()
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setPaneMenu({ x: event.clientX, y: event.clientY, flowX: flowPos.x, flowY: flowPos.y })
    },
    [screenToFlowPosition, closeAllMenus]
  )

  const addNodeAtPosition = useCallback(
    (flowX: number, flowY: number): void => {
      closeAllMenus()
      setNodes(nds => [
        ...nds,
        {
          id: crypto.randomUUID(),
          type: 'concept' as const,
          position: { x: flowX, y: flowY },
          data: { label: 'New concept', conceptType: 'concept' as const },
        },
      ])
    },
    [setNodes, closeAllMenus]
  )

  const addNoteAtPosition = useCallback(
    (flowX: number, flowY: number): void => {
      closeAllMenus()
      setNodes(nds => [
        ...nds,
        {
          id: crypto.randomUUID(),
          type: 'note' as const,
          position: { x: flowX, y: flowY },
          style: { width: NOTE_DEFAULT_WIDTH, height: NOTE_DEFAULT_HEIGHT },
          zIndex: -1,
          data: { label: '', backgroundColor: NOTE_DEFAULT_COLOR },
        },
      ])
    },
    [setNodes, closeAllMenus]
  )

  // G-12: single left-click on note does nothing — deselect immediately after RF selects it
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: CanvasFlowNode): void => {
      if (node.type !== 'note') return
      setNodes(nds => nds.map(n => (n.id === node.id ? { ...n, selected: false } : n)))
    },
    [setNodes]
  )

  // G-07: double-click on note background creates a new concept node at cursor
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: CanvasFlowNode): void => {
      if (node.type !== 'note') return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setNodes(nds => [
        ...nds,
        {
          id: crypto.randomUUID(),
          type: 'concept' as const,
          position,
          data: { label: 'New concept', conceptType: 'concept' as const },
        },
      ])
    },
    [screenToFlowPosition, setNodes]
  )

  // ---------- C-28 / G-11: right-click on concept node or note → context menu ----------

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: CanvasFlowNode): void => {
      event.preventDefault()
      closeAllMenus()
      if (node.type === 'concept') {
        setNodeMenu({ nodeId: node.id, x: event.clientX, y: event.clientY })
        return
      }
      if (node.type === 'branchHub') {
        setHubMenu({ hubNodeId: node.id, x: event.clientX, y: event.clientY })
        return
      }
      if (node.type === 'note') {
        const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        setNoteMenu({
          nodeId: node.id,
          x: event.clientX,
          y: event.clientY,
          flowX: flowPos.x,
          flowY: flowPos.y,
          mode: 'main',
        })
      }
    },
    [closeAllMenus, screenToFlowPosition]
  )

  // A-06–A-10, F-07: expand a concept node via Claude API
  const handleExpand = useCallback(
    async (nodeId: string): Promise<void> => {
      const node = nodesRef.current.find(n => n.id === nodeId && n.type === 'concept')
      if (!node) return

      const apiKey = getApiKey()
      if (!apiKey) {
        window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
        return
      }

      setExpandingNodeId(nodeId)
      setExpandError(null)

      const existingNodes: ConceptNodeType[] = nodesRef.current
        .filter(n => n.type === 'concept')
        .map(n => ({
          id: n.id,
          label: n.data.label,
          position: n.position,
          description: n.data.description,
        }))

      try {
        const response = await expandNode(
          {
            nodeId,
            nodeLabel: node.data.label,
            nodeDescription: node.data.description,
            focusQuestion,
            existingNodes,
          },
          apiKey
        )

        // A-09: deduplicate by label (case-insensitive)
        const existingLabels = new Set(existingNodes.map(n => n.label.toLowerCase().trim()))
        const newNodes = response.nodes.filter(
          n => !existingLabels.has(n.label.toLowerCase().trim())
        )
        if (newNodes.length === 0) return

        // Map Claude IDs → unique canvas IDs
        const ts = Date.now()
        const idMap = new Map<string, string>()
        newNodes.forEach((n, i) => {
          idMap.set(n.id, `node-${ts}-${i}`)
        })

        const positions = fanPositions(node.position, newNodes.length)
        const newFlowNodes: CanvasFlowNode[] = newNodes.map((n, i) => ({
          id: idMap.get(n.id) ?? `node-${ts}-${i}`,
          type: 'concept' as const,
          position: positions[i],
          data: { label: n.label },
        }))

        const newNodeClaudeIds = new Set(newNodes.map(n => n.id))
        const newFlowEdges: CanvasFlowEdge[] = response.edges
          .filter(e => newNodeClaudeIds.has(e.target))
          .map(e => ({
            id: `edge-${ts}-${Math.random().toString(36).slice(2, 7)}`,
            source: e.source === nodeId ? nodeId : (idMap.get(e.source) ?? e.source),
            target: idMap.get(e.target) ?? e.target,
            type: 'concept' as const,
            data: { label: e.label },
            markerEnd: MARKER_END_DEFAULT,
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          }))

        setNodes(nds => [...nds, ...newFlowNodes])
        setEdges(eds => [...eds, ...newFlowEdges])
        // A-25: fit to view after expanded nodes land
        setTimeout((): void => {
          fitView({ padding: 0.15, maxZoom: 1, duration: FIT_VIEW_DURATION_MS })
        }, 50)
      } catch (err) {
        setExpandError(err instanceof Error ? err.message : 'Expansion failed')
      } finally {
        setExpandingNodeId(null)
      }
    },
    [focusQuestion, setNodes, setEdges, fitView]
  )

  const deleteNote = useCallback(
    (nodeId: string): void => {
      setNoteMenu(null)
      setNodes(nds => nds.filter(n => n.id !== nodeId))
    },
    [setNodes]
  )

  // G-05: colour update — keep menu open so user can also adjust text size
  const setNoteColor = useCallback(
    (nodeId: string, color: string): void => {
      setNodes(nds =>
        nds.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, backgroundColor: color } } : n))
      )
    },
    [setNodes]
  )

  // G-06: text size update — keep menu open so user can also adjust colour
  const setNoteTextSize = useCallback(
    (nodeId: string, size: 'small' | 'medium' | 'large'): void => {
      setNodes(nds =>
        nds.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, textSize: size } } : n))
      )
    },
    [setNodes]
  )

  // ---------- A-35: suggest labels for an edge ----------

  const handleSuggestLabels = useCallback(
    async (edgeId: string): Promise<void> => {
      const edge = edgesRef.current.find(e => e.id === edgeId)
      if (!edge) return
      const sourceNode = nodesRef.current.find(n => n.id === edge.source)
      const targetNode = nodesRef.current.find(n => n.id === edge.target)
      if (!sourceNode || !targetNode) return

      const apiKey = getApiKey()
      if (!apiKey) {
        window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
        return
      }

      setEdgeLabelLoading(true)
      setEdgeLabelError(null)

      try {
        const content = await suggestEdgeLabels(
          sourceNode.data.label,
          sourceNode.data.description,
          targetNode.data.label,
          targetNode.data.description,
          focusQuestion || undefined,
          apiKey,
          getEdgeLabelPrompt()
        )
        setEdgeLabelPanel({ title: 'Suggest Labels', content, type: 'suggestLabels', edgeId })
      } catch (err) {
        setEdgeLabelError(err instanceof Error ? err.message : 'Request failed')
      } finally {
        setEdgeLabelLoading(false)
      }
    },
    [focusQuestion]
  )

  // ---------- A-36: explain an edge label ----------

  const handleExplainLabel = useCallback(
    async (edgeId: string): Promise<void> => {
      const edge = edgesRef.current.find(e => e.id === edgeId)
      if (!edge || !edge.data?.label) return
      const sourceNode = nodesRef.current.find(n => n.id === edge.source)
      const targetNode = nodesRef.current.find(n => n.id === edge.target)
      if (!sourceNode || !targetNode) return

      const apiKey = getApiKey()
      if (!apiKey) {
        window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
        return
      }

      setEdgeLabelLoading(true)
      setEdgeLabelError(null)

      try {
        const content = await explainEdgeLabel(
          edge.data.label,
          sourceNode.data.label,
          sourceNode.data.description,
          targetNode.data.label,
          targetNode.data.description,
          focusQuestion || undefined,
          apiKey,
          getEdgeLabelPrompt()
        )
        setEdgeLabelPanel({ title: `Explain: ${edge.data.label}`, content, type: 'explainLabel' })
      } catch (err) {
        setEdgeLabelError(err instanceof Error ? err.message : 'Request failed')
      } finally {
        setEdgeLabelLoading(false)
      }
    },
    [focusQuestion]
  )

  // ---------- A-39: suggest target concepts for an edge or hub ----------

  const handleSuggestConcepts = useCallback(
    async (
      sourceNodeId: string,
      edgeLabel: string,
      existingTargetNodeIds: string[],
      context: { edgeId: string } | { hubNodeId: string }
    ): Promise<void> => {
      const sourceNode = nodesRef.current.find(n => n.id === sourceNodeId)
      if (!sourceNode) return

      const apiKey = getApiKey()
      if (!apiKey) {
        window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
        return
      }

      const existingTargetLabels = existingTargetNodeIds
        .map(id => nodesRef.current.find(n => n.id === id)?.data.label)
        .filter((l): l is string => l !== undefined)

      setEdgeLabelLoading(true)
      setEdgeLabelError(null)

      try {
        const content = await suggestEdgeConcepts(
          sourceNode.data.label,
          sourceNode.data.description,
          edgeLabel,
          existingTargetLabels,
          focusQuestion || undefined,
          apiKey,
          getEdgeLabelPrompt()
        )
        setEdgeLabelPanel({
          title: 'Suggest Concepts',
          content,
          type: 'suggestConcepts',
          ...('edgeId' in context
            ? { edgeId: context.edgeId, sourceNodeId }
            : { hubNodeId: context.hubNodeId }),
        })
      } catch (err) {
        setEdgeLabelError(err instanceof Error ? err.message : 'Request failed')
      } finally {
        setEdgeLabelLoading(false)
      }
    },
    [focusQuestion]
  )

  // ---------- A-40: apply selected edge label ----------

  const applyEdgeLabel = useCallback(
    (edgeId: string, label: string): void => {
      setEdges(es => es.map(e => (e.id === edgeId ? { ...e, data: { ...e.data, label } } : e)))
      setEdgeLabelPanel(null)
    },
    [setEdges]
  )

  // ---------- A-41: apply selected concepts from a single edge ----------

  const applyConceptsFromEdge = useCallback(
    (edgeId: string, sourceNodeId: string, items: SuggestionItem[]): void => {
      const edge = edgesRef.current.find(e => e.id === edgeId)
      const sourceNode = nodesRef.current.find(n => n.id === sourceNodeId)
      if (!edge || !sourceNode) return

      const ts = Date.now()
      const newNodeIds = items.map((_, i) => `node-${ts}-${i}`)
      const positions = fanPositions(sourceNode.position, items.length)
      const newFlowNodes: CanvasFlowNode[] = items.map((item, i) => ({
        id: newNodeIds[i],
        type: 'concept' as const,
        position: positions[i],
        data: { label: item.label, description: item.explanation || undefined },
      }))

      // Convert single edge to branching hub (C-10) with original target + all new nodes
      const beId = crypto.randomUUID()
      const hub = hubNodeId(beId)
      const tn = nodesRef.current.find(n => n.id === edge.target)
      const hubX = tn
        ? (sourceNode.position.x + tn.position.x) / 2 - 20
        : sourceNode.position.x + 120
      const hubY = tn
        ? (sourceNode.position.y + tn.position.y) / 2 - 12
        : sourceNode.position.y - 12
      const edgeLabel = edge.data?.label ?? ''

      setNodes(nds => [
        ...nds,
        {
          id: hub,
          type: 'branchHub' as const,
          position: { x: hubX, y: hubY },
          data: { label: edgeLabel, branchingEdgeId: beId },
        },
        ...newFlowNodes,
      ])
      setEdges(eds => [
        ...eds.filter(e => e.id !== edgeId),
        {
          id: stemEdgeId(beId),
          source: edge.source,
          sourceHandle: edge.sourceHandle ?? null,
          target: hub,
          type: 'branchStem',
          data: { branchingEdgeId: beId, isStem: true },
        },
        {
          id: branchEdgeId(beId, edge.target),
          source: hub,
          target: edge.target,
          targetHandle: edge.targetHandle ?? null,
          type: 'branchArrow',
          data: { branchingEdgeId: beId, isBranch: true },
          markerEnd: MARKER_END_DEFAULT,
          style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
        },
        ...newNodeIds.map(nid => ({
          id: branchEdgeId(beId, nid),
          source: hub,
          target: nid,
          type: 'branchArrow',
          data: { branchingEdgeId: beId, isBranch: true },
          markerEnd: MARKER_END_DEFAULT,
          style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
        })),
      ])
      setEdgeLabelPanel(null)
      setTimeout((): void => {
        fitView({ padding: 0.15, maxZoom: 1, duration: FIT_VIEW_DURATION_MS })
      }, 50)
    },
    [setNodes, setEdges, fitView]
  )

  // ---------- A-41: apply selected concepts from a hub ----------

  const applyConceptsFromHub = useCallback(
    (hubId: string, items: SuggestionItem[]): void => {
      const hubNode = nodesRef.current.find(n => n.id === hubId)
      if (!hubNode?.data.branchingEdgeId) return
      const beId = hubNode.data.branchingEdgeId

      const ts = Date.now()
      const newNodeIds = items.map((_, i) => `node-${ts}-${i}`)
      const positions = fanPositions(hubNode.position, items.length)
      const newFlowNodes: CanvasFlowNode[] = items.map((item, i) => ({
        id: newNodeIds[i],
        type: 'concept' as const,
        position: positions[i],
        data: { label: item.label, description: item.explanation || undefined },
      }))

      setNodes(nds => [...nds, ...newFlowNodes])
      setEdges(eds => [
        ...eds,
        ...newNodeIds.map(nid => ({
          id: branchEdgeId(beId, nid),
          source: hubId,
          target: nid,
          type: 'branchArrow',
          data: { branchingEdgeId: beId, isBranch: true },
          markerEnd: MARKER_END_DEFAULT,
          style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
        })),
      ])
      setEdgeLabelPanel(null)
      setTimeout((): void => {
        fitView({ padding: 0.15, maxZoom: 1, duration: FIT_VIEW_DURATION_MS })
      }, 50)
    },
    [setNodes, setEdges, fitView]
  )

  // ---------- double-click pane to add node; dismiss all menus ----------

  const lastPaneClickTime = useRef<number>(0)
  const DOUBLE_CLICK_MS = 350

  const onPaneClick = useCallback(
    (event: React.MouseEvent): void => {
      closeAllMenus()
      const now = Date.now()
      const delta = now - lastPaneClickTime.current
      lastPaneClickTime.current = now
      if (delta > DOUBLE_CLICK_MS) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setNodes(nds => [
        ...nds,
        {
          id: crypto.randomUUID(),
          type: 'concept' as const,
          position,
          data: { label: 'New concept', conceptType: 'concept' as const },
        },
      ])
    },
    [screenToFlowPosition, setNodes, closeAllMenus]
  )

  useEffect((): (() => void) => {
    const anyOpen =
      contextMenu || hubMenu || paneMenu || noteMenu || nodeMenu || nodeInfoEdit || selectionMode
    if (!anyOpen) return (): void => {}
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (nodeInfoEdit) {
          nodeInfoCancelledRef.current = true
          setNodeInfoEdit(null)
          return
        }
        closeAllMenus()
        setSelectionMode(false)
      }
    }
    window.addEventListener('keydown', handler)
    return (): void => window.removeEventListener('keydown', handler)
  }, [
    contextMenu,
    hubMenu,
    paneMenu,
    noteMenu,
    nodeMenu,
    nodeInfoEdit,
    selectionMode,
    closeAllMenus,
  ])

  // C-25: while in selection mode, Space held → temporarily switch to pan mode
  useEffect((): (() => void) => {
    if (!selectionMode) return (): void => {}
    const onDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !e.repeat) setSpacePanning(true)
    }
    const onUp = (e: KeyboardEvent): void => {
      if (e.code === 'Space') setSpacePanning(false)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return (): void => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      setSpacePanning(false)
    }
  }, [selectionMode])

  // C-34–C-38: keyboard navigation and nudge
  useEffect((): (() => void) => {
    const handler = (e: KeyboardEvent): void => {
      // Do not intercept while an input/textarea is focused (node label editing etc.)
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      // Tab / Shift+Tab: cycle all concept nodes in spatial order (reading order: y then x)
      // Alt+Tab / Alt+Shift+Tab: cycle all edges in spatial order (by midpoint y then x)
      if (e.key === 'Tab') {
        const ns = nodesRef.current
        const es = edgesRef.current
        const conceptNodes = ns.filter(n => n.type === 'concept')
        const regularEdges = es.filter(ed => !ed.data?.isStem && !ed.data?.isBranch)

        if (e.altKey) {
          // Alt+Tab / Alt+Shift+Tab: cycle edges
          if (regularEdges.length === 0) return
          e.preventDefault()
          const sorted = [...regularEdges].sort((a, b) => {
            const aNode = conceptNodes.find(n => n.id === a.source)
            const bNode = conceptNodes.find(n => n.id === b.source)
            const ay = aNode?.position.y ?? 0
            const by = bNode?.position.y ?? 0
            if (Math.abs(ay - by) > 20) return ay - by
            return (aNode?.position.x ?? 0) - (bNode?.position.x ?? 0)
          })
          const currentIdx = sorted.findIndex(ed => ed.selected)
          const step = e.shiftKey ? -1 : 1
          const nextIdx =
            currentIdx === -1
              ? step === 1
                ? 0
                : sorted.length - 1
              : (currentIdx + step + sorted.length) % sorted.length
          const nextId = sorted[nextIdx].id
          setEdges(prev => prev.map(ed => ({ ...ed, selected: ed.id === nextId })))
          setNodes(prev => prev.map(n => ({ ...n, selected: false })))
        } else {
          // Tab / Shift+Tab: cycle concept nodes
          if (conceptNodes.length === 0) return
          e.preventDefault()
          const sorted = [...conceptNodes].sort((a, b) => {
            if (Math.abs(a.position.y - b.position.y) > 20) return a.position.y - b.position.y
            return a.position.x - b.position.x
          })
          const currentIdx = sorted.findIndex(n => n.selected)
          const step = e.shiftKey ? -1 : 1
          const nextIdx =
            currentIdx === -1
              ? step === 1
                ? 0
                : sorted.length - 1
              : (currentIdx + step + sorted.length) % sorted.length
          const nextId = sorted[nextIdx].id
          setNodes(prev => prev.map(n => ({ ...n, selected: n.id === nextId })))
          setEdges(prev => prev.map(ed => ({ ...ed, selected: false })))
        }
        return
      }

      const dir = ARROW_DIRS[e.key]
      if (!dir) return

      const ns = nodesRef.current
      const es = edgesRef.current
      const conceptNodes = ns.filter(n => n.type === 'concept')
      const regularEdges = es.filter(ed => !ed.data?.isStem && !ed.data?.isBranch)
      const selectedConcepts = conceptNodes.filter(n => n.selected)
      const selectedEdges = regularEdges.filter(ed => ed.selected)
      const totalSelected = ns.filter(n => n.selected).length + es.filter(ed => ed.selected).length

      // C-38: Ctrl/Cmd+Arrow → nudge selected concept node(s)
      if (e.ctrlKey || e.metaKey) {
        if (selectedConcepts.length === 0) return
        e.preventDefault()
        setNodes(prev =>
          prev.map(n =>
            n.selected && n.type === 'concept'
              ? {
                  ...n,
                  position: {
                    x: n.position.x + dir.dx * NUDGE_STEP,
                    y: n.position.y + dir.dy * NUDGE_STEP,
                  },
                }
              : n
          )
        )
        return
      }

      // Alt+Arrow: C-37 — navigate to the connected edge whose other endpoint is most in that direction
      if (e.altKey) {
        e.preventDefault()
        const dirAngle = Math.atan2(dir.dy, dir.dx)

        // Determine pivot node for edge search
        let pivotId: string | null = null
        if (selectedConcepts.length === 1 && selectedEdges.length === 0) {
          pivotId = selectedConcepts[0].id
        } else if (selectedEdges.length === 1 && selectedConcepts.length === 0) {
          pivotId = selectedEdges[0].source
        } else {
          // Nothing or multi selected: pick random edge
          if (regularEdges.length === 0) return
          const pick = regularEdges[Math.floor(Math.random() * regularEdges.length)]
          setEdges(prev => prev.map(ed => ({ ...ed, selected: ed.id === pick.id })))
          setNodes(prev => prev.map(n => ({ ...n, selected: false })))
          return
        }

        const pivotNode = conceptNodes.find(n => n.id === pivotId)
        if (!pivotNode) return
        // All edges touching this node — outgoing (source) or incoming (target)
        const connected = regularEdges.filter(ed => ed.source === pivotId || ed.target === pivotId)
        if (connected.length === 0) return

        let bestEdgeId: string | null = null
        let bestAngle = Infinity
        for (const edge of connected) {
          // Other endpoint: if we are the source, it's the target; if we are the target, it's the source
          const otherId = edge.source === pivotId ? edge.target : edge.source
          const other = conceptNodes.find(n => n.id === otherId)
          if (!other) continue
          const dx = other.position.x - pivotNode.position.x
          const dy = other.position.y - pivotNode.position.y
          if (dx * dir.dx + dy * dir.dy <= 0) continue // wrong half-plane
          const diff = angleDiff(Math.atan2(dy, dx), dirAngle)
          if (diff < bestAngle) {
            bestAngle = diff
            bestEdgeId = edge.id
          }
        }
        if (bestEdgeId !== null) {
          setEdges(prev => prev.map(ed => ({ ...ed, selected: ed.id === bestEdgeId })))
          setNodes(prev => prev.map(n => ({ ...n, selected: false })))
        }
        return
      }

      // Plain arrow keys: C-34, C-35, C-36

      // C-36: single edge selected → no-op
      if (selectedEdges.length === 1 && selectedConcepts.length === 0) {
        e.preventDefault()
        return
      }

      // C-35: nothing selected or multi-selection → pick random concept node
      if (totalSelected === 0 || totalSelected > 1) {
        e.preventDefault()
        if (conceptNodes.length === 0) return
        const pick = conceptNodes[Math.floor(Math.random() * conceptNodes.length)]
        setNodes(prev => prev.map(n => ({ ...n, selected: n.id === pick.id })))
        setEdges(prev => prev.map(ed => ({ ...ed, selected: false })))
        return
      }

      // C-34: single concept node selected → navigate to graph neighbour (any connected edge)
      if (selectedConcepts.length === 1) {
        e.preventDefault()
        const current = selectedConcepts[0]
        // Include both outgoing (source) and incoming (target) edges
        const connected = regularEdges.filter(
          ed => ed.source === current.id || ed.target === current.id
        )
        if (connected.length === 0) return
        const dirAngle = Math.atan2(dir.dy, dir.dx)

        let bestNodeId: string | null = null
        let bestAngle = Infinity
        for (const edge of connected) {
          const otherId = edge.source === current.id ? edge.target : edge.source
          const tgt = conceptNodes.find(n => n.id === otherId)
          if (!tgt) continue
          const dx = tgt.position.x - current.position.x
          const dy = tgt.position.y - current.position.y
          if (dx * dir.dx + dy * dir.dy <= 0) continue // wrong half-plane
          const diff = angleDiff(Math.atan2(dy, dx), dirAngle)
          if (diff < bestAngle) {
            bestAngle = diff
            bestNodeId = tgt.id
          }
        }
        if (bestNodeId !== null) {
          setNodes(prev => prev.map(n => ({ ...n, selected: n.id === bestNodeId })))
          setEdges(prev => prev.map(ed => ({ ...ed, selected: false })))
        }
      }
    }

    // Use capture phase so our handler fires before React Flow's internal listeners
    window.addEventListener('keydown', handler, true)
    return (): void => window.removeEventListener('keydown', handler, true)
  }, [setNodes, setEdges])

  // Use nodes (render-cycle state) so colour/size highlights update live while menu is open
  const noteMenuNode = noteMenu ? nodes.find(n => n.id === noteMenu.nodeId) : null
  const noteMenuCurrentColor = noteMenuNode?.data.backgroundColor ?? NOTE_DEFAULT_COLOR
  const noteMenuCurrentSize = (noteMenuNode?.data.textSize ?? 'medium') as
    | 'small'
    | 'medium'
    | 'large'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: COLOR_CANVAS_BG,
        touchAction: 'manipulation',
      }}
    >
      <style>{`
        .react-flow__edge-path { stroke: ${COLOR_EDGE}; stroke-width: 1.5px; transition: stroke ${TRANSITION_FAST}; }
        .react-flow__edge.selected .react-flow__edge-path,
        .react-flow__edge:focus .react-flow__edge-path { stroke: ${COLOR_EDGE_SELECTED}; }
        .react-flow__controls { background-color: ${COLOR_CONTROLS_BG}; border: 1px solid ${COLOR_CONTROLS_BORDER}; border-radius: 6px; overflow: hidden; }
        .react-flow__controls-button { background-color: ${COLOR_CONTROLS_BG}; border-bottom: 1px solid ${COLOR_CONTROLS_BORDER}; color: ${COLOR_CONTROLS_TEXT}; fill: ${COLOR_CONTROLS_TEXT}; transition: background-color ${TRANSITION_FAST}; }
        .react-flow__controls-button:hover { background-color: ${COLOR_CONTROLS_HOVER_BG}; }
        .react-flow__controls-button svg { fill: ${COLOR_CONTROLS_TEXT}; }
        .react-flow__minimap { border: 1px solid ${COLOR_MINIMAP_BORDER}; border-radius: 6px; overflow: hidden; }
        .react-flow__node-note { z-index: -1 !important; }
        .react-flow__node-note.react-flow__node-dragging { z-index: -1 !important; }
        .react-flow__selection { border: 1px solid rgba(249,115,22,0.5) !important; background: rgba(249,115,22,0.05) !important; box-shadow: none !important; }
        .react-flow__edge:not(.selected) .react-flow__edgeupdater-target { pointer-events: none !important; opacity: 0 !important; }
        .react-flow__edge.selected .react-flow__edgeupdater-target { transform-box: fill-box; transform-origin: center; transform: scale(2.5); }
        @media (prefers-reduced-motion: reduce) { .react-flow__edge-path, .react-flow__controls-button { transition: none; } }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={computedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEndCb}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        zoomOnDoubleClick={false}
        deleteKeyCode={['Backspace', 'Delete']}
        disableKeyboardA11y={true}
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={selectionMode && !spacePanning}
        panOnDrag={!selectionMode || spacePanning}
        style={{ backgroundColor: COLOR_CANVAS_BG }}
        aria-label="Concept map canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color={COLOR_BG_DOT}
          size={BG_DOT_SIZE}
          gap={BG_DOT_GAP}
        />
        <Controls aria-label="Canvas controls" style={{ bottom: TICKER_HEIGHT + 2 }} />
        <MiniMap
          nodeColor={COLOR_NODE_BG}
          nodeStrokeColor={COLOR_NODE_BORDER}
          maskColor={COLOR_MINIMAP_MASK}
          style={{ backgroundColor: COLOR_CANVAS_BG, bottom: TICKER_HEIGHT + 2 }}
          aria-label="Minimap"
          pannable
          zoomable
        />
      </ReactFlow>

      {nodes.filter(n => n.type === 'concept').length === 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            opacity: 0.25,
            color: COLOR_NODE_TEXT,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_NODE_LABEL,
            fontWeight: FONT_WEIGHT_NODE_LABEL,
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          Double click to start
        </div>
      )}

      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={(): void => setContextMenu(null)}
            onContextMenu={(e): void => {
              e.preventDefault()
              setContextMenu(null)
            }}
          />
          <div
            role="menu"
            aria-label="Edge options"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 1000,
              background: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              minWidth: 148,
            }}
          >
            {/* A-35: Suggest Labels — always present on single edges */}
            <button
              role="menuitem"
              disabled={!aiAssistEnabled || edgeLabelLoading}
              onClick={(): void => {
                const edgeId = contextMenu.edgeId
                setContextMenu(null)
                void handleSuggestLabels(edgeId)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                textAlign: 'left',
                cursor: !aiAssistEnabled || edgeLabelLoading ? 'not-allowed' : 'pointer',
                opacity: !aiAssistEnabled || edgeLabelLoading ? 0.35 : 1,
                pointerEvents: !aiAssistEnabled ? 'none' : 'auto',
                transition: `background ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
              }}
              onMouseEnter={(e): void => {
                if (aiAssistEnabled && !edgeLabelLoading)
                  (e.currentTarget as HTMLButtonElement).style.background = '#21262d'
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
              aria-label="Suggest edge labels with AI"
            >
              Suggest Labels
            </button>
            {/* A-36: Explain Label — only when label is set and not '?' */}
            {contextMenu.edgeLabel && contextMenu.edgeLabel !== '?' && (
              <button
                role="menuitem"
                disabled={!aiAssistEnabled || edgeLabelLoading}
                onClick={(): void => {
                  const edgeId = contextMenu.edgeId
                  setContextMenu(null)
                  void handleExplainLabel(edgeId)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  color: COLOR_NODE_TEXT,
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZE_NODE_LABEL,
                  textAlign: 'left',
                  cursor: !aiAssistEnabled || edgeLabelLoading ? 'not-allowed' : 'pointer',
                  opacity: !aiAssistEnabled || edgeLabelLoading ? 0.35 : 1,
                  pointerEvents: !aiAssistEnabled ? 'none' : 'auto',
                  transition: `background ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
                }}
                onMouseEnter={(e): void => {
                  if (aiAssistEnabled && !edgeLabelLoading)
                    (e.currentTarget as HTMLButtonElement).style.background = '#21262d'
                }}
                onMouseLeave={(e): void => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
                aria-label="Explain edge label with AI"
              >
                Explain Label
              </button>
            )}
            {/* A-38/A-39: Suggest Concepts — dimmed when label is '?' or AI Assist off */}
            <button
              role="menuitem"
              disabled={
                !aiAssistEnabled ||
                edgeLabelLoading ||
                !contextMenu.edgeLabel ||
                contextMenu.edgeLabel === '?'
              }
              onClick={(): void => {
                const { sourceNodeId, targetNodeId, edgeLabel, edgeId } = contextMenu
                setContextMenu(null)
                void handleSuggestConcepts(sourceNodeId, edgeLabel ?? '', [targetNodeId], {
                  edgeId,
                })
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                textAlign: 'left',
                cursor:
                  !aiAssistEnabled ||
                  edgeLabelLoading ||
                  !contextMenu.edgeLabel ||
                  contextMenu.edgeLabel === '?'
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  !aiAssistEnabled ||
                  edgeLabelLoading ||
                  !contextMenu.edgeLabel ||
                  contextMenu.edgeLabel === '?'
                    ? 0.35
                    : 1,
                pointerEvents:
                  !aiAssistEnabled || !contextMenu.edgeLabel || contextMenu.edgeLabel === '?'
                    ? 'none'
                    : 'auto',
                transition: `background ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
              }}
              onMouseEnter={(e): void => {
                const disabled =
                  !aiAssistEnabled ||
                  edgeLabelLoading ||
                  !contextMenu.edgeLabel ||
                  contextMenu.edgeLabel === '?'
                if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#21262d'
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
              aria-label="Suggest target concepts with AI"
            >
              Suggest Concepts
            </button>
            <div style={{ height: 1, backgroundColor: COLOR_NODE_BORDER }} />
            {/* C-10: Branch — only when label exists */}
            {contextMenu.edgeLabel && (
              <button
                role="menuitem"
                onClick={(): void => convertToBranchingEdge(contextMenu.edgeId)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  color: COLOR_NODE_TEXT,
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZE_NODE_LABEL,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: `background ${TRANSITION_FAST}`,
                }}
                onMouseEnter={(e): void => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#21262d'
                }}
                onMouseLeave={(e): void => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
                aria-label="Convert to branching edge"
              >
                Branch
              </button>
            )}
          </div>
        </>
      )}

      {/* A-38: hub right-click menu — "Suggest Concepts" */}
      {hubMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={(): void => setHubMenu(null)}
            onContextMenu={(e): void => {
              e.preventDefault()
              setHubMenu(null)
            }}
          />
          <div
            role="menu"
            aria-label="Hub options"
            style={{
              position: 'fixed',
              left: hubMenu.x,
              top: hubMenu.y,
              zIndex: 1000,
              background: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              minWidth: 148,
            }}
          >
            <button
              role="menuitem"
              disabled={!aiAssistEnabled || edgeLabelLoading}
              onClick={(): void => {
                const hubNodeId = hubMenu.hubNodeId
                const hubNode = nodesRef.current.find(n => n.id === hubNodeId)
                if (!hubNode?.data.branchingEdgeId) {
                  setHubMenu(null)
                  return
                }
                const beId = hubNode.data.branchingEdgeId
                const stemEdge = edgesRef.current.find(
                  e => e.data?.isStem && e.data.branchingEdgeId === beId
                )
                const branchEdges = edgesRef.current.filter(
                  e => e.data?.isBranch && e.data.branchingEdgeId === beId
                )
                const sourceNodeId = stemEdge?.source ?? ''
                const targetNodeIds = branchEdges.map(e => e.target)
                const edgeLabel = hubNode.data.label
                setHubMenu(null)
                void handleSuggestConcepts(sourceNodeId, edgeLabel, targetNodeIds, {
                  hubNodeId,
                })
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                textAlign: 'left',
                cursor: !aiAssistEnabled || edgeLabelLoading ? 'not-allowed' : 'pointer',
                opacity: !aiAssistEnabled || edgeLabelLoading ? 0.35 : 1,
                pointerEvents: !aiAssistEnabled ? 'none' : 'auto',
                transition: `background ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
              }}
              onMouseEnter={(e): void => {
                if (aiAssistEnabled && !edgeLabelLoading)
                  (e.currentTarget as HTMLButtonElement).style.background = '#21262d'
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
              aria-label="Suggest target concepts with AI"
            >
              Suggest Concepts
            </button>
          </div>
        </>
      )}

      {/* C-28: concept node right-click menu */}
      {nodeMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={(): void => setNodeMenu(null)}
            onContextMenu={(e): void => {
              e.preventDefault()
              setNodeMenu(null)
            }}
          />
          <div
            role="menu"
            aria-label="Node options"
            style={{
              position: 'fixed',
              left: nodeMenu.x,
              top: nodeMenu.y,
              zIndex: 1000,
              background: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              minWidth: 130,
            }}
          >
            <button
              role="menuitem"
              disabled={expandingNodeId !== null || !aiAssistEnabled}
              onClick={(): void => {
                const nodeId = nodeMenu.nodeId
                setNodeMenu(null)
                void handleExpand(nodeId)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                textAlign: 'left',
                cursor: expandingNodeId !== null || !aiAssistEnabled ? 'not-allowed' : 'pointer',
                opacity: !aiAssistEnabled ? 0.35 : expandingNodeId !== null ? 0.4 : 1,
                pointerEvents: !aiAssistEnabled ? 'none' : 'auto',
                transition: `background ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
              }}
              onMouseEnter={(e): void => {
                if (expandingNodeId === null && aiAssistEnabled)
                  (e.currentTarget as HTMLButtonElement).style.background = '#21262d'
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
              aria-label="Expand node with AI"
            >
              Expand
            </button>
            <div style={{ height: 1, backgroundColor: COLOR_NODE_BORDER }} />
            {/* A-26: Chat — always visible; dimmed when AI Assist off */}
            <button
              role="menuitem"
              disabled={!aiAssistEnabled}
              onClick={(): void => {
                const node = nodesRef.current.find(n => n.id === nodeMenu.nodeId)
                if (!node) return
                setNodeMenu(null)
                onChatNode?.(node.id, node.data.label, node.data.description)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                textAlign: 'left',
                cursor: !aiAssistEnabled ? 'not-allowed' : 'pointer',
                opacity: !aiAssistEnabled ? 0.35 : 1,
                pointerEvents: !aiAssistEnabled ? 'none' : 'auto',
                transition: `background ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
              }}
              onMouseEnter={(e): void => {
                if (aiAssistEnabled)
                  (e.currentTarget as HTMLButtonElement).style.background = '#21262d'
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
              aria-label="Chat with AI about this node"
            >
              Chat
            </button>
            <div style={{ height: 1, backgroundColor: COLOR_NODE_BORDER }} />
            <button
              role="menuitem"
              onClick={(): void => {
                const node = nodesRef.current.find(n => n.id === nodeMenu.nodeId)
                const currentDesc = node?.data.description ?? ''
                setNodeInfoEdit({
                  nodeId: nodeMenu.nodeId,
                  x: nodeMenu.x,
                  y: nodeMenu.y + 8,
                  draft: currentDesc,
                })
                setNodeMenu(null)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                textAlign: 'left',
                cursor: 'pointer',
                transition: `background ${TRANSITION_FAST}`,
              }}
              onMouseEnter={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = '#21262d'
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
              aria-label="Edit node description"
            >
              Edit Info
            </button>
          </div>
        </>
      )}

      {/* A-04/A-05 analog: expansion loading and error indicators */}
      {expandingNodeId !== null && (
        <>
          <style>{`
            @keyframes cf-thinking-sweep {
              0%   { background-position: 0% 50%; }
              50%  { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              bottom: TICKER_HEIGHT + 36,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              padding: 2,
              borderRadius: 8,
              background: `linear-gradient(90deg, ${COLOR_THINKING_BORDER_DEEP}, ${COLOR_THINKING_BORDER_SKY}, ${COLOR_THINKING_BORDER_DEEP})`,
              backgroundSize: '200% 200%',
              animation: `cf-thinking-sweep ${THINKING_BORDER_DURATION_MS}ms ease infinite`,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: COLOR_NODE_BG,
                borderRadius: 6,
                padding: '6px 14px',
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                color: COLOR_TEXT_MUTED,
              }}
            >
              Expanding…
            </div>
          </div>
        </>
      )}
      {expandError !== null && (
        <div
          role="alert"
          onClick={(): void => setExpandError(null)}
          style={{
            position: 'absolute',
            bottom: TICKER_HEIGHT + 36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            backgroundColor: COLOR_NODE_BG,
            border: `1px solid ${COLOR_NODE_BORDER}`,
            borderRadius: 6,
            padding: '6px 14px',
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_NODE_LABEL,
            color: COLOR_STATUS_ERROR,
            cursor: 'pointer',
            maxWidth: 360,
            textAlign: 'center',
          }}
        >
          {expandError}
        </div>
      )}

      {/* A-35/A-36: edge label AI — loading indicator */}
      {edgeLabelLoading && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            padding: 2,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${COLOR_THINKING_BORDER_DEEP}, ${COLOR_THINKING_BORDER_SKY}, ${COLOR_THINKING_BORDER_DEEP})`,
            backgroundSize: '200% 200%',
            animation: `cf-thinking-sweep ${THINKING_BORDER_DURATION_MS}ms ease infinite`,
          }}
        >
          <div
            style={{
              background: COLOR_NODE_BG,
              borderRadius: 6,
              padding: '8px 16px',
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_NODE_LABEL,
              color: COLOR_TEXT_MUTED,
            }}
          >
            Thinking…
          </div>
        </div>
      )}

      {/* A-35/A-36: edge label AI — error indicator */}
      {edgeLabelError !== null && (
        <div
          role="alert"
          onClick={(): void => setEdgeLabelError(null)}
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            background: COLOR_NODE_BG,
            border: `1px solid ${COLOR_STATUS_ERROR}`,
            borderRadius: 6,
            padding: '8px 16px',
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_NODE_LABEL,
            color: COLOR_STATUS_ERROR,
            cursor: 'pointer',
            maxWidth: 360,
            textAlign: 'center',
          }}
        >
          {edgeLabelError}
        </div>
      )}

      {/* A-36: explain label — read-only markdown panel */}
      {edgeLabelPanel?.type === 'explainLabel' && (
        <ChatReadingPanel
          content={edgeLabelPanel.content}
          title={edgeLabelPanel.title}
          onDismiss={(): void => setEdgeLabelPanel(null)}
        />
      )}

      {/* A-40: suggest labels — single-select interactive panel */}
      {edgeLabelPanel?.type === 'suggestLabels' && edgeLabelPanel.edgeId && (
        <SuggestionSelectPanel
          title={edgeLabelPanel.title}
          content={edgeLabelPanel.content}
          mode="single"
          onDismiss={(): void => setEdgeLabelPanel(null)}
          onApply={(selected): void => {
            if (selected[0] && edgeLabelPanel.edgeId) {
              applyEdgeLabel(edgeLabelPanel.edgeId, selected[0].label)
            }
          }}
        />
      )}

      {/* A-41: suggest concepts — multi-select interactive panel */}
      {edgeLabelPanel?.type === 'suggestConcepts' && (
        <SuggestionSelectPanel
          title={edgeLabelPanel.title}
          content={edgeLabelPanel.content}
          mode="multi"
          onDismiss={(): void => setEdgeLabelPanel(null)}
          onApply={(selected): void => {
            if (edgeLabelPanel.hubNodeId) {
              applyConceptsFromHub(edgeLabelPanel.hubNodeId, selected)
            } else if (edgeLabelPanel.edgeId && edgeLabelPanel.sourceNodeId) {
              applyConceptsFromEdge(edgeLabelPanel.edgeId, edgeLabelPanel.sourceNodeId, selected)
            }
          }}
        />
      )}

      {/* C-28: description edit popover — blur saves, Escape cancels */}
      {nodeInfoEdit && (
        <div
          style={{
            position: 'fixed',
            left: nodeInfoEdit.x,
            top: nodeInfoEdit.y,
            zIndex: 1000,
            background: COLOR_NODE_BG,
            border: `1px solid ${COLOR_NODE_BORDER}`,
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            padding: '10px 12px',
            width: 220,
          }}
          // Prevent clicks inside the popover from propagating to the canvas
          onClick={(e): void => e.stopPropagation()}
          onContextMenu={(e): void => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: COLOR_TEXT_MUTED,
              fontFamily: FONT_FAMILY,
              marginBottom: 8,
            }}
          >
            Node Info
          </div>
          <textarea
            autoFocus
            value={nodeInfoEdit.draft}
            onChange={(e): void =>
              setNodeInfoEdit(prev => (prev ? { ...prev, draft: e.target.value } : null))
            }
            onBlur={(): void => {
              if (nodeInfoCancelledRef.current) {
                nodeInfoCancelledRef.current = false
                return
              }
              const desc = nodeInfoEdit.draft.trim() || undefined
              setNodes(nds =>
                nds.map(n =>
                  n.id === nodeInfoEdit.nodeId
                    ? { ...n, data: { ...n.data, description: desc } }
                    : n
                )
              )
              setNodeInfoEdit(null)
            }}
            onKeyDown={(e): void => {
              e.stopPropagation()
              if (e.key === 'Escape') {
                e.preventDefault()
                nodeInfoCancelledRef.current = true
                setNodeInfoEdit(null)
              }
            }}
            placeholder="Enter a brief description…"
            rows={3}
            style={{
              width: '100%',
              background: COLOR_CANVAS_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 4,
              color: COLOR_NODE_TEXT,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_NODE_LABEL,
              padding: '6px 8px',
              resize: 'none',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            aria-label="Node description"
          />
        </div>
      )}

      {/* G-01: pane right-click menu — Add Node / Add Note */}
      {paneMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={(): void => setPaneMenu(null)}
            onContextMenu={(e): void => {
              e.preventDefault()
              setPaneMenu(null)
            }}
          />
          <div
            role="menu"
            aria-label="Canvas options"
            style={{
              position: 'fixed',
              left: paneMenu.x,
              top: paneMenu.y,
              zIndex: 1000,
              background: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              minWidth: 130,
            }}
          >
            {(
              [
                {
                  label: 'Add Node',
                  action: (): void => addNodeAtPosition(paneMenu.flowX, paneMenu.flowY),
                  ariaLabel: 'Add concept node',
                },
                {
                  label: 'Add Note',
                  action: (): void => addNoteAtPosition(paneMenu.flowX, paneMenu.flowY),
                  ariaLabel: 'Add note',
                },
              ] as const
            ).map(item => (
              <button
                key={item.label}
                role="menuitem"
                onClick={item.action}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  color: COLOR_NODE_TEXT,
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZE_NODE_LABEL,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: `background ${TRANSITION_FAST}`,
                }}
                onMouseEnter={(e): void => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#21262d'
                }}
                onMouseLeave={(e): void => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
                aria-label={item.ariaLabel}
              >
                {item.label}
              </button>
            ))}
            {/* C-23: Select mode toggle — active state shown with orange accent */}
            <div style={{ borderTop: `1px solid ${COLOR_NODE_BORDER}`, margin: '2px 0' }} />
            <button
              role="menuitem"
              onClick={(): void => {
                setSelectionMode(prev => !prev)
                setPaneMenu(null)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: selectionMode ? COLOR_NODE_SELECTED : COLOR_NODE_TEXT,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_NODE_LABEL,
                textAlign: 'left',
                cursor: 'pointer',
                transition: `background ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
              }}
              onMouseEnter={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = '#21262d'
              }}
              onMouseLeave={(e): void => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
              aria-label={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
              aria-pressed={selectionMode}
            >
              <span
                style={{
                  width: 10,
                  display: 'inline-block',
                  textAlign: 'center',
                  opacity: selectionMode ? 1 : 0,
                  color: COLOR_NODE_SELECTED,
                  transition: `opacity ${TRANSITION_FAST}`,
                }}
                aria-hidden="true"
              >
                ✓
              </span>
              Select
            </button>
          </div>
        </>
      )}

      {/* G-11: note right-click menu — main actions or edit sub-panel */}
      {noteMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={(): void => setNoteMenu(null)}
            onContextMenu={(e): void => {
              e.preventDefault()
              setNoteMenu(null)
            }}
          />
          <div
            role="menu"
            aria-label="Note options"
            style={{
              position: 'fixed',
              left: noteMenu.x,
              top: noteMenu.y,
              zIndex: 1000,
              background: COLOR_NODE_BG,
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              minWidth: noteMenu.mode === 'edit' ? 168 : 130,
              overflow: 'hidden',
            }}
          >
            {noteMenu.mode === 'main' ? (
              // Main mode: four actions
              (
                [
                  {
                    label: 'Add Node',
                    action: (): void => addNodeAtPosition(noteMenu.flowX, noteMenu.flowY),
                    ariaLabel: 'Add concept node',
                  },
                  {
                    label: 'Add Note',
                    action: (): void => addNoteAtPosition(noteMenu.flowX, noteMenu.flowY),
                    ariaLabel: 'Add note',
                  },
                  {
                    label: 'Edit Note',
                    action: (): void =>
                      setNoteMenu(prev => (prev ? { ...prev, mode: 'edit' } : null)),
                    ariaLabel: 'Edit note colour and text size',
                  },
                  {
                    label: 'Delete Note',
                    action: (): void => deleteNote(noteMenu.nodeId),
                    ariaLabel: 'Delete note',
                    danger: true,
                  },
                ] as const
              ).map(item => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={item.action}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    color: 'danger' in item && item.danger ? '#f85149' : COLOR_NODE_TEXT,
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZE_NODE_LABEL,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: `background ${TRANSITION_FAST}`,
                  }}
                  onMouseEnter={(e): void => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = '#21262d'
                  }}
                  onMouseLeave={(e): void => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                  }}
                  aria-label={item.ariaLabel}
                >
                  {item.label}
                </button>
              ))
            ) : (
              // Edit mode: colour palette + text size
              <div style={{ padding: '10px 12px' }}>
                <button
                  role="menuitem"
                  onClick={(): void =>
                    setNoteMenu(prev => (prev ? { ...prev, mode: 'main' } : null))
                  }
                  aria-label="Back to note options"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 10,
                    background: 'none',
                    border: 'none',
                    color: COLOR_TEXT_MUTED,
                    fontFamily: FONT_FAMILY,
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ← Back
                </button>
                <div
                  style={{
                    marginBottom: 8,
                    fontSize: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: COLOR_TEXT_MUTED,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Color
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 4,
                    marginBottom: 12,
                  }}
                >
                  {NOTE_COLORS.map(color => (
                    <button
                      key={color}
                      role="menuitem"
                      onClick={(): void => setNoteColor(noteMenu.nodeId, color)}
                      aria-label={`Set note color ${color}`}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 3,
                        backgroundColor: color,
                        border:
                          color === noteMenuCurrentColor
                            ? `2px solid ${COLOR_NODE_SELECTED}`
                            : `1px solid ${COLOR_NODE_BORDER}`,
                        cursor: 'pointer',
                        padding: 0,
                        transition: `border-color ${TRANSITION_FAST}`,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    marginBottom: 8,
                    fontSize: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: COLOR_TEXT_MUTED,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Text size
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <button
                      key={size}
                      role="menuitem"
                      onClick={(): void => setNoteTextSize(noteMenu.nodeId, size)}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        background: noteMenuCurrentSize === size ? COLOR_NODE_SELECTED : '#21262d',
                        border: 'none',
                        borderRadius: 3,
                        color: noteMenuCurrentSize === size ? '#0d1117' : COLOR_NODE_TEXT,
                        fontFamily: FONT_FAMILY,
                        fontSize: NOTE_TEXT_SIZES[size],
                        cursor: 'pointer',
                        transition: `background ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
                      }}
                      aria-label={`Set text size ${size}`}
                    >
                      {size[0].toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface CanvasProps {
  ref?: React.Ref<CanvasHandle>
  onNodeCountChange?: (count: number) => void
  focusQuestion?: string
  aiAssistEnabled?: boolean
  onChatNode?: (nodeId: string, nodeLabel: string, nodeDescription?: string) => void
}

export function Canvas({
  ref,
  onNodeCountChange,
  focusQuestion,
  aiAssistEnabled = true,
  onChatNode,
}: CanvasProps): React.JSX.Element {
  return (
    <ReactFlowProvider>
      <CanvasFlow
        ref={ref}
        onNodeCountChange={onNodeCountChange}
        focusQuestion={focusQuestion}
        aiAssistEnabled={aiAssistEnabled}
        onChatNode={onChatNode}
      />
    </ReactFlowProvider>
  )
}
