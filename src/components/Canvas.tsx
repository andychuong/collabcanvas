import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { Shape, Cursor as CursorType, ViewportState } from '../types';
import { CanvasGrid } from './canvas/CanvasGrid';
import { ShapeRenderer } from './canvas/ShapeRenderer';
import { CursorLayer } from './canvas/CursorLayer';
import { Minimap } from './canvas/Minimap';
import { TextEditor } from './canvas/TextEditor';
import { useCanvasViewport } from '../hooks/useCanvasViewport';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useTextEditing } from '../hooks/useTextEditing';

interface CanvasProps {
  shapes: Shape[];
  cursors: CursorType[];
  onShapeUpdate: (shape: Shape) => void;
  onShapeSelect: (shapeId: string | null) => void;
  onMultiSelect?: (shapeIds: string[]) => void;
  selectedShapeId: string | null;
  selectedShapeIds?: string[];
  onCursorMove: (x: number, y: number) => void;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  onViewportInteraction?: (isInteracting: boolean) => void;
  showMinimap?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  shapes,
  cursors,
  onShapeUpdate,
  onShapeSelect,
  onMultiSelect,
  selectedShapeId,
  selectedShapeIds = [],
  onCursorMove,
  viewport,
  onViewportChange,
  onViewportInteraction,
  showMinimap = false,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ 
    width: Math.max(Math.min(window.innerWidth - 360, 1600), 400),
    height: Math.max(Math.min(window.innerHeight - 140, 900), 300)
  });

  // Custom hooks
  const {
    handleWheel,
    handleDragEnd: viewportDragEnd,
    handleDragStart: viewportDragStart,
    dragBoundFunc,
  } = useCanvasViewport({
    viewport,
    stageSize,
    stageRef,
    onViewportChange,
    onViewportInteraction,
  });

  const {
    handleStageClick,
    handleShapeClick,
    handleShapeDragStart,
    handleShapeDragEnd,
    handleStageDragEnd,
  } = useCanvasInteraction({
    stageRef,
    onShapeUpdate,
    onShapeSelect,
    onMultiSelect,
    selectedShapeIds,
  });

  const {
    editingTextId,
    textareaValue,
    textareaPosition,
    setTextareaValue,
    handleTextDblClick,
    handleTextEditComplete,
  } = useTextEditing({
    shapes,
    stageRef,
    onShapeUpdate,
  });

  // Handle window resize - calculate based on available space
  useEffect(() => {
    const handleResize = () => {
      // Account for toolbar (60px), sidebar width (280px), gaps and padding
      const availableWidth = window.innerWidth - 280 - 80; // sidebar + padding
      const availableHeight = window.innerHeight - 60 - 80; // toolbar + padding
      
      const width = Math.min(availableWidth, 1600);
      const height = Math.min(availableHeight, 900);
      
      setStageSize({
        width: Math.max(width, 400),
        height: Math.max(height, 300),
      });
    };

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (pos) {
      // Convert screen coordinates to canvas coordinates
      const scale = viewport.scale;
      const x = (pos.x - viewport.x) / scale;
      const y = (pos.y - viewport.y) / scale;
      onCursorMove(x, y);
    }
  }, [viewport, onCursorMove]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    onCursorMove(-1000, -1000); // Move cursor off screen
  }, [onCursorMove]);

  // Combined drag end handler
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    viewportDragEnd(e);
    handleStageDragEnd();
  }, [viewportDragEnd, handleStageDragEnd]);

  return (
    <div className="flex items-center justify-center">
      <div className="relative border-4 border-gray-300 rounded-lg shadow-2xl overflow-hidden bg-white" style={{
        width: stageSize.width,
        height: stageSize.height,
      }}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={true}
          dragBoundFunc={dragBoundFunc}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onDragStart={viewportDragStart}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background layer with grid */}
          <CanvasGrid />

          {/* Shapes layer */}
          <ShapeRenderer
            shapes={shapes}
            selectedShapeId={selectedShapeId}
            selectedShapeIds={selectedShapeIds}
            editingTextId={editingTextId}
            onShapeClick={handleShapeClick}
            onShapeDragStart={handleShapeDragStart}
            onShapeDragEnd={handleShapeDragEnd}
            onTextDblClick={handleTextDblClick}
          />

          {/* Cursors layer */}
          <CursorLayer cursors={cursors} />
        </Stage>

        {/* Minimap - shown during pan/zoom, positioned at bottom-right of canvas */}
        {showMinimap && (
          <Minimap viewport={viewport} stageSize={stageSize} />
        )}
      </div>
      
      {/* Text editing textarea - positioned relative to viewport */}
      <TextEditor
        editingTextId={editingTextId}
        textareaValue={textareaValue}
        textareaPosition={textareaPosition}
        shapes={shapes}
        viewport={viewport}
        onTextareaChange={setTextareaValue}
        onTextEditComplete={handleTextEditComplete}
      />
    </div>
  );
};
