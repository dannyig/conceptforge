import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
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
import type { BranchingEdge, ConceptNode as ConceptNodeType, MapData } from '@/types'
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
  COLOR_NODE_TEXT,
  FONT_FAMILY,
  FONT_SIZE_NODE_LABEL,
  TRANSITION_FAST,
  FONT_WEIGHT_NODE_LABEL,
} from '@/lib/theme'

// Canvas-internal node data — superset of concept-node data and branch-hub data
type CanvasNodeData = {
  label: string
  conceptType?: 'concept' | 'question' | 'source' | 'insight'
  branchingEdgeId?: string
  autoEdit?: boolean
}
type CanvasFlowNode = Node<CanvasNodeData>

// Canvas-internal edge data
type CanvasEdgeData = {
  label?: string
  branchingEdgeId?: string
  isStem?: boolean
  isBranch?: boolean
}
type CanvasFlowEdge = Edge<CanvasEdgeData>

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

// Stable type-map references — must live outside the component to avoid RF re-renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_TYPES: Record<string, React.ComponentType<any>> = {
  concept: ConceptNode,
  branchHub: BranchHubNode,
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: Record<string, React.ComponentType<any>> = {
  default: ConceptEdge,
  branchStem: BranchStemEdge,
  branchArrow: BranchArrowEdge,
}
const DEFAULT_EDGE_OPTIONS = {
  markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
  style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
}

export interface CanvasHandle {
  getMapData: () => MapData
  setMapData: (data: MapData) => void
}

interface CanvasFlowProps {
  ref?: React.Ref<CanvasHandle>
}

// Inner component — must be inside ReactFlowProvider to use useReactFlow
function CanvasFlow({ ref }: CanvasFlowProps): React.JSX.Element {
  const { screenToFlowPosition } = useReactFlow()
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

  const [contextMenu, setContextMenu] = useState<{
    edgeId: string
    x: number
    y: number
  } | null>(null)

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
        return {
          nodes: ns
            .filter(n => n.type !== 'branchHub')
            .map(
              (n): ConceptNodeType => ({
                id: n.id,
                label: n.data.label,
                position: n.position,
                type: n.data.conceptType,
              })
            ),
          edges: es
            .filter(e => !e.data?.isStem && !e.data?.isBranch)
            .map(e => ({
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.data?.label,
            })),
          branchingEdges: beMap.size > 0 ? [...beMap.values()] : undefined,
        }
      },

      setMapData: (data: MapData): void => {
        const newNodes: CanvasFlowNode[] = data.nodes.map(n => ({
          id: n.id,
          type: 'concept' as const,
          position: n.position,
          data: { label: n.label, conceptType: n.type },
        }))
        const newEdges: CanvasFlowEdge[] = data.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          data: { label: e.label },
          markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
          style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
        }))
        if (data.branchingEdges) {
          for (const be of data.branchingEdges) {
            const hub = hubNodeId(be.id)
            newNodes.push({
              id: hub,
              type: 'branchHub' as const,
              position: be.labelPosition ?? { x: 0, y: 0 },
              data: { label: be.label, branchingEdgeId: be.id },
            })
            newEdges.push({
              id: stemEdgeId(be.id),
              source: be.source,
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
                markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
                style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
              })
            }
          }
        }
        setNodes(newNodes)
        setEdges(newEdges)
      },
    }),
    [setNodes, setEdges]
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
          target: hub,
          type: 'branchStem',
          data: { branchingEdgeId: beId, isStem: true },
        },
        {
          id: branchEdgeId(beId, edge.target),
          source: hub,
          target: edge.target,
          type: 'branchArrow',
          data: { branchingEdgeId: beId, isBranch: true },
          markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
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
            markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
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
            data: { label: '' },
            markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
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
      const state = connectionState as unknown as { fromHandle?: { nodeId?: string } | null }
      const fromNodeId = state.fromHandle?.nodeId
      if (!fromNodeId) return
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
            markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
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
            target: newNodeId,
            type: 'default',
            data: { label: '' },
            markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          },
        ])
      }
    },
    [screenToFlowPosition, setNodes, setEdges]
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
                  target: lastBranch.target,
                  type: 'default',
                  data: { label: hubNode.data.label },
                  markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
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

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: CanvasFlowEdge): void => {
    event.preventDefault()
    if (!edge.data?.label || edge.data?.isStem || edge.data?.isBranch) return
    setContextMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY })
  }, [])

  // ---------- double-click pane to add node; dismiss context menu ----------

  const lastPaneClickTime = useRef<number>(0)
  const DOUBLE_CLICK_MS = 350

  const onPaneClick = useCallback(
    (event: React.MouseEvent): void => {
      setContextMenu(null)
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
    [screenToFlowPosition, setNodes]
  )

  useEffect((): (() => void) => {
    if (!contextMenu) return (): void => {}
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('keydown', handler)
    return (): void => window.removeEventListener('keydown', handler)
  }, [contextMenu])

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
        @media (prefers-reduced-motion: reduce) { .react-flow__edge-path, .react-flow__controls-button { transition: none; } }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneClick}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 0.85 }}
        deleteKeyCode={['Backspace', 'Delete']}
        style={{ backgroundColor: COLOR_CANVAS_BG }}
        aria-label="Concept map canvas"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color={COLOR_BG_DOT}
          size={BG_DOT_SIZE}
          gap={BG_DOT_GAP}
        />
        <Controls aria-label="Canvas controls" />
        <MiniMap
          nodeColor={COLOR_NODE_BG}
          nodeStrokeColor={COLOR_NODE_BORDER}
          maskColor={COLOR_MINIMAP_MASK}
          style={{ backgroundColor: COLOR_CANVAS_BG }}
          aria-label="Minimap"
        />
      </ReactFlow>

      {nodes.length === 0 && (
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
            minWidth: 120,
          }}
        >
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
            }}
            aria-label="Convert to branching edge"
          >
            Branch
          </button>
        </div>
      )}
    </div>
  )
}

interface CanvasProps {
  ref?: React.Ref<CanvasHandle>
}

export function Canvas({ ref }: CanvasProps): React.JSX.Element {
  return (
    <ReactFlowProvider>
      <CanvasFlow ref={ref} />
    </ReactFlowProvider>
  )
}
