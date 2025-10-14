import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { ViewportState } from '../types';
import { clampViewportPosition, VIEWPORT_MULTIPLIER } from '../utils/canvasHelpers';

interface UseCanvasViewportProps {
  viewport: ViewportState;
  stageSize: { width: number; height: number };
  stageRef: React.RefObject<Konva.Stage>;
  onViewportChange: (viewport: ViewportState) => void;
  onViewportInteraction?: (isInteracting: boolean) => void;
}

export const useCanvasViewport = ({
  viewport,
  stageSize,
  stageRef,
  onViewportChange,
  onViewportInteraction,
}: UseCanvasViewportProps) => {
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle viewport interaction visibility
  const notifyInteraction = useCallback(() => {
    if (onViewportInteraction) {
      onViewportInteraction(true);
      
      // Clear existing timer
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
      
      // Hide minimap after 2 seconds of no interaction
      interactionTimerRef.current = setTimeout(() => {
        onViewportInteraction(false);
      }, 2000);
    }
  }, [onViewportInteraction]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    notifyInteraction(); // Show minimap

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Calculate minimum scale to fit entire grid in viewport
    const workspaceWidth = 1600 * VIEWPORT_MULTIPLIER;
    const workspaceHeight = 900 * VIEWPORT_MULTIPLIER;
    const minScaleX = stageSize.width / workspaceWidth;
    const minScaleY = stageSize.height / workspaceHeight;
    const minScale = Math.min(minScaleX, minScaleY);

    // Clamp scale between minScale (to keep grid visible) and 5 (max zoom in)
    const clampedScale = Math.max(minScale, Math.min(5, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // Clamp position to grid boundaries
    const clampedPos = clampViewportPosition(newPos.x, newPos.y, clampedScale, stageSize.width, stageSize.height);

    onViewportChange({
      x: clampedPos.x,
      y: clampedPos.y,
      scale: clampedScale,
    });
  }, [viewport, onViewportChange, stageSize, stageRef, notifyInteraction]);

  // Handle stage drag (panning)
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Only update viewport if we're dragging the stage itself, not a shape
    if (e.target === stageRef.current) {
      // Clamp position to grid boundaries
      const clampedPos = clampViewportPosition(e.target.x(), e.target.y(), viewport.scale, stageSize.width, stageSize.height);
      
      // Update both the stage position and viewport state
      e.target.x(clampedPos.x);
      e.target.y(clampedPos.y);
      
      onViewportChange({
        x: clampedPos.x,
        y: clampedPos.y,
        scale: viewport.scale,
      });
    }
  }, [viewport.scale, onViewportChange, stageRef, stageSize]);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Only set isDragging if we're dragging the stage itself
    if (e.target === stageRef.current) {
      notifyInteraction(); // Show minimap
    }
  }, [stageRef, notifyInteraction]);

  // Drag bound function to constrain stage dragging in real-time
  const dragBoundFunc = useCallback((pos: { x: number; y: number }) => {
    return clampViewportPosition(pos.x, pos.y, viewport.scale, stageSize.width, stageSize.height);
  }, [viewport.scale, stageSize]);

  return {
    handleWheel,
    handleDragEnd,
    handleDragStart,
    dragBoundFunc,
  };
};

