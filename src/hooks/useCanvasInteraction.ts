import { useState, useCallback } from 'react';
import Konva from 'konva';
import { Shape } from '../types';

interface UseCanvasInteractionProps {
  stageRef: React.RefObject<Konva.Stage>;
  onShapeUpdate: (shape: Shape) => void;
  onShapeSelect: (shapeId: string | null) => void;
  onMultiSelect?: (shapeIds: string[]) => void;
  selectedShapeIds?: string[];
}

export const useCanvasInteraction = ({
  stageRef,
  onShapeUpdate,
  onShapeSelect,
  onMultiSelect,
  selectedShapeIds = [],
}: UseCanvasInteractionProps) => {
  const [isDragging, setIsDragging] = useState(false);

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
  }, [isDragging, onShapeSelect, onMultiSelect, selectedShapeIds]);

  // Handle shape drag
  const handleShapeDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage from being dragged when dragging a shape
    e.cancelBubble = true;
    setIsDragging(true);
  }, []);

  const handleShapeDragEnd = useCallback((shape: Shape, e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage drag event
    e.cancelBubble = true;
    
    const node = e.target;
    onShapeUpdate({
      ...shape,
      x: node.x(),
      y: node.y(),
      updatedAt: Date.now(),
    });
    
    setIsDragging(false);
  }, [onShapeUpdate]);

  const handleStageDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    handleStageClick,
    handleShapeClick,
    handleShapeDragStart,
    handleShapeDragEnd,
    handleStageDragEnd,
  };
};

