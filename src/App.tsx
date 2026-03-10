import React, { useRef } from 'react'
import { Canvas, type CanvasHandle } from '@/components/canvas/Canvas'

export function App(): React.JSX.Element {
  const canvasRef = useRef<CanvasHandle>(null)

  return <Canvas ref={canvasRef} />
}
