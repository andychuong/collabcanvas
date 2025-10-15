import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { Shape, Cursor as CursorType, ViewportState, ShapeType } from '../types';
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
  shapeToPlace: ShapeType | null;
  onPlaceShape: (x: number, y: number) => void;
  isSelectMode?: boolean;
  onExitSelectMode?: () => void;
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
  shapeToPlace,
  onPlaceShape,
  isSelectMode = false,
  onExitSelectMode,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ 
    width: window.innerWidth,
    height: window.innerHeight - 104 // 60px toolbar + 44px footer
  });
  
  // Selection box state
  const [selectionBox, setSelectionBox] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [panStartPos, setPanStartPos] = useState<{ x: number; y: number } | null>(null);
  
  // Select mode state (when Cmd/Ctrl is held via keyboard)
  const [isKeyboardSelectMode, setIsKeyboardSelectMode] = useState(false);
  
  // Combined select mode: either button toggle or keyboard modifier
  const effectiveSelectMode = isSelectMode || isKeyboardSelectMode;

  // Custom hooks
  const {
    handleWheel,
  } = useCanvasViewport({
    viewport,
    stageSize,
    stageRef,
    onViewportChange,
    onViewportInteraction,
  });

  // Wrap exit callback to only exit if button mode is active (not just keyboard)
  const handleExitSelectModeIfButton = useCallback(() => {
    if (isSelectMode && onExitSelectMode) {
      onExitSelectMode();
    }
  }, [isSelectMode, onExitSelectMode]);

  // Handle batch update for group dragging
  const handleBatchUpdate = useCallback((updatedShapes: Shape[]) => {
    updatedShapes.forEach(shape => onShapeUpdate(shape));
  }, [onShapeUpdate]);

  const {
    handleShapeClick,
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
  } = useCanvasInteraction({
    stageRef,
    onShapeUpdate,
    onShapeSelect,
    onMultiSelect,
    selectedShapeIds,
    isSelectMode: effectiveSelectMode,
    onExitSelectMode: handleExitSelectModeIfButton,
    shapes,
    onBatchUpdate: handleBatchUpdate,
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
      // Full width and height minus toolbar (60px) and footer (44px)
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 104,
      });
    };

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard events for select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setIsKeyboardSelectMode(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setIsKeyboardSelectMode(false);
      }
    };

    // Also handle blur to reset select mode
    const handleBlur = () => {
      setIsKeyboardSelectMode(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Handle mouse move for panning
  const handlePanMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning || !panStart) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (pos) {
      const dx = pos.x - panStart.x;
      const dy = pos.y - panStart.y;
      
      onViewportChange({
        ...viewport,
        x: viewport.x + dx,
        y: viewport.y + dy,
      });
      
      setPanStart({ x: pos.x, y: pos.y });
    }
  }, [isPanning, panStart, viewport, onViewportChange]);

  // Handle mouse move for selection box
  const handleStageMouseMoveSelection = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawingSelection || !selectionBox) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (pos) {
      const scale = viewport.scale;
      const x = (pos.x - viewport.x) / scale;
      const y = (pos.y - viewport.y) / scale;
      
      setSelectionBox({
        ...selectionBox,
        x2: x,
        y2: y,
      });
    }
  }, [isDrawingSelection, selectionBox, viewport]);

  // Handle mouse move for cursor tracking, panning, and selection box
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

    // Handle panning
    handlePanMove(e);

    // Handle selection box drawing
    handleStageMouseMoveSelection(e);
  }, [viewport, onCursorMove, handlePanMove, handleStageMouseMoveSelection]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    onCursorMove(-1000, -1000); // Move cursor off screen
    
    // End panning if active
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      setPanStartPos(null);
      if (onViewportInteraction) {
        onViewportInteraction(false);
      }
    }
    
    // Clear selection box if drawing
    if (isDrawingSelection) {
      setIsDrawingSelection(false);
      setSelectionBox(null);
    }
  }, [onCursorMove, isPanning, isDrawingSelection, onViewportInteraction]);

  // Handle mouse down on stage for selection box or panning
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const evt = e.evt;
    const stage = e.target.getStage();
    if (!stage) return;

    // Check if middle mouse button is pressed for panning
    const isMiddleButton = evt.button === 1;
    
    if (isMiddleButton) {
      // Start panning
      const pos = stage.getPointerPosition();
      if (pos) {
        setIsPanning(true);
        setPanStart({ x: pos.x, y: pos.y });
        setPanStartPos({ x: pos.x, y: pos.y });
        if (onViewportInteraction) {
          onViewportInteraction(true);
        }
      }
      evt.preventDefault();
      return;
    }

    // If in placement mode, place the shape
    if (shapeToPlace) {
      const pos = stage.getPointerPosition();
      if (pos) {
        // Convert screen coordinates to canvas coordinates
        const scale = viewport.scale;
        const x = (pos.x - viewport.x) / scale;
        const y = (pos.y - viewport.y) / scale;
        onPlaceShape(x, y);
      }
      return;
    }

    // Check if Ctrl/Cmd is held for selection mode (or if select mode button is active)
    const selectModeActive = effectiveSelectMode || evt.ctrlKey || evt.metaKey;
    
    // Check if clicking on the stage background (not a shape)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty && !shapeToPlace && selectModeActive) {
      // Start drawing selection box when Cmd/Ctrl is held
      const pos = stage.getPointerPosition();
      if (pos) {
        const scale = viewport.scale;
        const x = (pos.x - viewport.x) / scale;
        const y = (pos.y - viewport.y) / scale;
        
        setIsDrawingSelection(true);
        setSelectionBox({
          x1: x,
          y1: y,
          x2: x,
          y2: y,
        });
      }
    } else if (clickedOnEmpty && !shapeToPlace && !selectModeActive) {
      // Start panning when clicking on empty space without select mode
      const pos = stage.getPointerPosition();
      if (pos) {
        setIsPanning(true);
        setPanStart({ x: pos.x, y: pos.y });
        setPanStartPos({ x: pos.x, y: pos.y });
        if (onViewportInteraction) {
          onViewportInteraction(true);
        }
      }
    }
  }, [shapeToPlace, viewport, onPlaceShape, onViewportInteraction, onShapeSelect, onMultiSelect, effectiveSelectMode, isSelectMode, isKeyboardSelectMode]);

  // Handle mouse up for selection box and panning
  const handleStageMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // End panning
    if (isPanning) {
      // Check if it was just a click (minimal movement)
      const stage = e.target.getStage();
      if (stage && panStartPos) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const dx = Math.abs(pos.x - panStartPos.x);
          const dy = Math.abs(pos.y - panStartPos.y);
          
          // If movement was less than 5 pixels, treat it as a click
          if (dx < 5 && dy < 5) {
            // Deselect all shapes on click
            onShapeSelect(null);
            if (onMultiSelect) {
              onMultiSelect([]);
            }
          }
        }
      }
      
      setIsPanning(false);
      setPanStart(null);
      setPanStartPos(null);
      if (onViewportInteraction) {
        onViewportInteraction(false);
      }
    }

    if (!isDrawingSelection || !selectionBox) return;

    setIsDrawingSelection(false);

    // Calculate selection box bounds
    const box = {
      x: Math.min(selectionBox.x1, selectionBox.x2),
      y: Math.min(selectionBox.y1, selectionBox.y2),
      width: Math.abs(selectionBox.x2 - selectionBox.x1),
      height: Math.abs(selectionBox.y2 - selectionBox.y1),
    };

    // Check if it was just a click (minimal movement)
    const wasClick = box.width < 5 && box.height < 5;

    // Only select if box has some size (not just a click)
    if (box.width > 5 || box.height > 5) {
      // Find all shapes that intersect with the selection box
      const selectedIds = shapes.filter((shape) => {
        let shapeBox = {
          x: shape.x,
          y: shape.y,
          width: 0,
          height: 0,
        };

        if (shape.type === 'rectangle') {
          shapeBox.width = shape.width || 0;
          shapeBox.height = shape.height || 0;
        } else if (shape.type === 'circle') {
          const radius = shape.radius || 0;
          shapeBox.x = shape.x - radius;
          shapeBox.y = shape.y - radius;
          shapeBox.width = radius * 2;
          shapeBox.height = radius * 2;
        } else if (shape.type === 'text') {
          shapeBox.width = 200; // Approximate text width
          shapeBox.height = shape.fontSize || 24;
        } else if (shape.type === 'line' && shape.points) {
          const xs = [shape.x + shape.points[0], shape.x + shape.points[2]];
          const ys = [shape.y + shape.points[1], shape.y + shape.points[3]];
          shapeBox.x = Math.min(...xs);
          shapeBox.y = Math.min(...ys);
          shapeBox.width = Math.abs(xs[1] - xs[0]);
          shapeBox.height = Math.abs(ys[1] - ys[0]);
        }

        // Check if boxes intersect
        return !(
          shapeBox.x + shapeBox.width < box.x ||
          box.x + box.width < shapeBox.x ||
          shapeBox.y + shapeBox.height < box.y ||
          box.y + box.height < shapeBox.y
        );
      }).map(shape => shape.id);

      if (selectedIds.length > 0) {
        if (onMultiSelect) {
          onMultiSelect(selectedIds);
        }
        if (selectedIds.length === 1) {
          onShapeSelect(selectedIds[0]);
        }
        // Exit select mode after making a selection (only if button was pressed)
        if (isSelectMode && onExitSelectMode) {
          onExitSelectMode();
        }
      } else {
        // Clear selection if nothing selected
        onShapeSelect(null);
        if (onMultiSelect) {
          onMultiSelect([]);
        }
      }
    } else {
      // Just a click, deselect all
      onShapeSelect(null);
      if (onMultiSelect) {
        onMultiSelect([]);
      }
    }

    // Exit select mode after a click on empty space (only if button was pressed)
    if (wasClick && isSelectMode && onExitSelectMode) {
      onExitSelectMode();
    }

    setSelectionBox(null);
  }, [isPanning, panStartPos, isDrawingSelection, selectionBox, shapes, onShapeSelect, onMultiSelect, onViewportInteraction, isSelectMode, onExitSelectMode]);

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
          draggable={false}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ 
            cursor: shapeToPlace ? 'crosshair' : isPanning ? 'grabbing' : effectiveSelectMode ? 'pointer' : 'grab' 
          }}
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
            onShapeDragMove={handleShapeDragMove}
            onShapeDragEnd={handleShapeDragEnd}
            onTextDblClick={handleTextDblClick}
            onShapeUpdate={onShapeUpdate}
          />

          {/* Cursors layer */}
          <CursorLayer cursors={cursors} />

          {/* Selection box layer */}
          {selectionBox && (
            <Layer>
              <Rect
                x={Math.min(selectionBox.x1, selectionBox.x2)}
                y={Math.min(selectionBox.y1, selectionBox.y2)}
                width={Math.abs(selectionBox.x2 - selectionBox.x1)}
                height={Math.abs(selectionBox.y2 - selectionBox.y1)}
                fill="rgba(0, 123, 255, 0.1)"
                stroke="#007bff"
                strokeWidth={2}
                dash={[5, 5]}
                listening={false}
              />
            </Layer>
          )}
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
