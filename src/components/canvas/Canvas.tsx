import React, { useCallback, useImperativeHandle, useRef } from 'react'
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
} from '@xyflow/react'
import { ConceptNode, type ConceptFlowNode } from './ConceptNode'
import type { MapData } from '@/types'
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
  TRANSITION_FAST,
} from '@/lib/theme'

type EdgeData = { label?: string }
type ConceptFlowEdge = Edge<EdgeData>

// Stable reference — must not be defined inside component to avoid React Flow re-renders
const NODE_TYPES = { concept: ConceptNode }

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

// Inner component — must be a child of ReactFlowProvider to use useReactFlow
function CanvasFlow({ ref }: CanvasFlowProps): React.JSX.Element {
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ConceptFlowEdge>([])

  useImperativeHandle(
    ref,
    (): CanvasHandle => ({
      getMapData: (): MapData => ({
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data.label,
          position: n.position,
          type: n.data.conceptType,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label,
        })),
      }),
      setMapData: (data: MapData): void => {
        setNodes(
          data.nodes.map(n => ({
            id: n.id,
            type: 'concept',
            position: n.position,
            data: { label: n.label, conceptType: n.type },
          }))
        )
        setEdges(
          data.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            data: { label: e.label },
            markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          }))
        )
      },
    }),
    [nodes, edges, setNodes, setEdges]
  )

  const onConnect = useCallback(
    (params: Connection): void => {
      if (params.source === params.target) return
      setEdges(eds =>
        addEdge(
          {
            ...params,
            id: crypto.randomUUID(),
            markerEnd: { type: MarkerType.ArrowClosed, color: COLOR_EDGE },
            style: { stroke: COLOR_EDGE, strokeWidth: 1.5 },
          },
          eds
        )
      )
    },
    [setEdges]
  )

  // React Flow consumes dblclick events internally (for pan). Use onPaneClick with a
  // time-based double-click detector instead — this uses React Flow's own callback.
  const lastPaneClickTime = useRef<number>(0)
  const DOUBLE_CLICK_MS = 350

  const onPaneClick = useCallback(
    (event: React.MouseEvent): void => {
      const now = Date.now()
      const delta = now - lastPaneClickTime.current
      lastPaneClickTime.current = now
      if (delta > DOUBLE_CLICK_MS) return // single click — ignore

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const newNode: ConceptFlowNode = {
        id: crypto.randomUUID(),
        type: 'concept',
        position,
        data: { label: 'New concept', conceptType: 'concept' },
      }
      setNodes(nds => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes]
  )

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: COLOR_CANVAS_BG,
        touchAction: 'manipulation',
      }}
    >
      {/* Scoped overrides for React Flow internals that cannot be styled via inline styles */}
      <style>{`
        .react-flow__edge-path {
          stroke: ${COLOR_EDGE};
          stroke-width: 1.5px;
          transition: stroke ${TRANSITION_FAST};
        }
        .react-flow__edge.selected .react-flow__edge-path,
        .react-flow__edge:focus .react-flow__edge-path {
          stroke: ${COLOR_EDGE_SELECTED};
        }
        .react-flow__controls {
          background-color: ${COLOR_CONTROLS_BG};
          border: 1px solid ${COLOR_CONTROLS_BORDER};
          border-radius: 6px;
          overflow: hidden;
        }
        .react-flow__controls-button {
          background-color: ${COLOR_CONTROLS_BG};
          border-bottom: 1px solid ${COLOR_CONTROLS_BORDER};
          color: ${COLOR_CONTROLS_TEXT};
          fill: ${COLOR_CONTROLS_TEXT};
          transition: background-color ${TRANSITION_FAST};
        }
        .react-flow__controls-button:hover {
          background-color: ${COLOR_CONTROLS_HOVER_BG};
        }
        .react-flow__controls-button svg {
          fill: ${COLOR_CONTROLS_TEXT};
        }
        .react-flow__minimap {
          border: 1px solid ${COLOR_MINIMAP_BORDER};
          border-radius: 6px;
          overflow: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          .react-flow__edge-path,
          .react-flow__controls-button {
            transition: none;
          }
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={NODE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        fitView
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
