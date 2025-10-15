import { useState, useCallback } from 'react';
import Konva from 'konva';
import { Shape } from '../types';

interface UseCanvasInteractionProps {
  stageRef: React.RefObject<Konva.Stage>;
  onShapeUpdate: (shape: Shape, immediate?: boolean) => void;
  onShapeSelect: (shapeId: string | null) => void;
  onMultiSelect?: (shapeIds: string[]) => void;
  selectedShapeIds?: string[];
  isSelectMode?: boolean;
  onExitSelectMode?: () => void;
  shapes?: Shape[];
  onBatchUpdate?: (shapes: Shape[]) => void;
  onCursorMove?: (x: number, y: number) => void;
}

export const useCanvasInteraction = ({
  stageRef,
  onShapeUpdate,
  onShapeSelect,
  onMultiSelect,
  selectedShapeIds = [],
  isSelectMode = false,
  onExitSelectMode,
  shapes = [],
  onBatchUpdate,
  onCursorMove,
}: UseCanvasInteractionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Handle stage selection
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicked on empty area, deselect
    if (e.target === stageRef.current || e.target.parent?.attrs.name === 'background-layer') {
      onShapeSelect(null);
      if (onMultiSelect) {
        onMultiSelect([]);
      }
    }
  }, [onShapeSelect, onMultiSelect, stageRef]);

  const handleShapeClick = useCallback((shapeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDragging) return;

    const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
    
    if (isMultiSelect && onMultiSelect) {
      // Multi-select mode
      const currentSelection = selectedShapeIds || [];
      if (currentSelection.includes(shapeId)) {
        // Deselect if already selected
        onMultiSelect(currentSelection.filter(id => id !== shapeId));
      } else {
        // Add to selection
        onMultiSelect([...currentSelection, shapeId]);
      }
    } else {
      // Single select
      onShapeSelect(shapeId);
      if (onMultiSelect) {
        onMultiSelect([shapeId]);
      }
    }
    
    // Exit select mode after clicking a shape (only if callback is provided, meaning button was pressed)
    if (onExitSelectMode) {
      onExitSelectMode();
    }
  }, [isDragging, onShapeSelect, onMultiSelect, selectedShapeIds, onExitSelectMode]);

  // Handle shape drag
  const handleShapeDragStart = useCallback((draggedShapeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    // Check if Ctrl/Cmd is held or select mode button is active - prevent dragging
    const evt = e.evt as MouseEvent;
    const selectModeActive = isSelectMode || evt.ctrlKey || evt.metaKey;
    
    // Check if middle mouse button is pressed - prevent dragging to allow panning
    const isMiddleButton = evt.button === 1;
    
    // Check if the shape being dragged is selected - only allow dragging selected shapes
    const isShapeSelected = selectedShapeIds.includes(draggedShapeId);
    
    if (selectModeActive || isMiddleButton || !isShapeSelected) {
      // Cancel drag when in select mode, middle mouse button is pressed, or shape is not selected
      e.target.stopDrag();
      return;
    }
    
    // Prevent stage from being dragged when dragging a shape
    e.cancelBubble = true;
    setIsDragging(true);
    
    // If multiple shapes are selected and this is one of them, store all positions
    if (selectedShapeIds.length > 1 && selectedShapeIds.includes(draggedShapeId)) {
      const positions: Record<string, { x: number; y: number }> = {};
      shapes.forEach(shape => {
        if (selectedShapeIds.includes(shape.id)) {
          positions[shape.id] = { x: shape.x, y: shape.y };
        }
      });
      setDragStartPositions(positions);
    }
  }, [isSelectMode, selectedShapeIds, shapes]);

  const handleShapeDragMove = useCallback((shape: Shape, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    
    // Update cursor position during drag
    const stage = node.getStage();
    if (stage && onCursorMove) {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        const scale = stage.scaleX();
        const stagePos = stage.position();
        const canvasX = (pointerPos.x - stagePos.x) / scale;
        const canvasY = (pointerPos.y - stagePos.y) / scale;
        onCursorMove(canvasX, canvasY);
      }
    }
    
    // If multiple shapes are selected, update all their positions in real-time
    if (selectedShapeIds.length > 1 && selectedShapeIds.includes(shape.id) && Object.keys(dragStartPositions).length > 0) {
      const deltaX = newX - dragStartPositions[shape.id].x;
      const deltaY = newY - dragStartPositions[shape.id].y;
      
      // Find the stage to update other shapes
      const stage = node.getStage();
      if (!stage) return;
      
      // Update positions of all other selected shapes during drag
      selectedShapeIds.forEach(shapeId => {
        if (shapeId !== shape.id) {
          const otherNode = stage.findOne(`#${shapeId}`);
          if (otherNode && dragStartPositions[shapeId]) {
            otherNode.x(dragStartPositions[shapeId].x + deltaX);
            otherNode.y(dragStartPositions[shapeId].y + deltaY);
          }
        }
      });
      
      stage.batchDraw();
      
      // Update state for all selected shapes so handles/anchors move smoothly
      shapes
        .filter(s => selectedShapeIds.includes(s.id))
        .forEach(s => {
          onShapeUpdate({
            ...s,
            x: dragStartPositions[s.id].x + deltaX,
            y: dragStartPositions[s.id].y + deltaY,
            updatedAt: Date.now(),
          }, false);
        });
    } else {
      // Single shape drag - update state during drag for smooth handle movement
      // Use immediate=false for throttled updates
      onShapeUpdate({
        ...shape,
        x: newX,
        y: newY,
        updatedAt: Date.now(),
      }, false);
    }
  }, [selectedShapeIds, dragStartPositions, onShapeUpdate, shapes, onCursorMove]);

  const handleShapeDragEnd = useCallback((shape: Shape, e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage drag event
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    
    // If multiple shapes are selected, move them all together
    if (selectedShapeIds.length > 1 && selectedShapeIds.includes(shape.id) && Object.keys(dragStartPositions).length > 0) {
      const deltaX = newX - dragStartPositions[shape.id].x;
      const deltaY = newY - dragStartPositions[shape.id].y;
      
      const updatedShapes = shapes
        .filter(s => selectedShapeIds.includes(s.id))
        .map(s => ({
          ...s,
          x: dragStartPositions[s.id].x + deltaX,
          y: dragStartPositions[s.id].y + deltaY,
          updatedAt: Date.now(),
        }));
      
      if (onBatchUpdate) {
        onBatchUpdate(updatedShapes);
      }
      
      setDragStartPositions({});
    } else {
      // Single shape drag - use immediate update for undo/redo
      onShapeUpdate({
        ...shape,
        x: newX,
        y: newY,
        updatedAt: Date.now(),
      }, true); // immediate = true so undo history captures it
    }
    
    setIsDragging(false);
  }, [onShapeUpdate, selectedShapeIds, dragStartPositions, shapes, onBatchUpdate]);

  const handleStageDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    handleStageClick,
    handleShapeClick,
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
    handleStageDragEnd,
  };
};

