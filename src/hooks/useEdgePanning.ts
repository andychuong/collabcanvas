import { useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { ViewportState } from '../types';
import { clampViewportPosition } from '../utils/canvasHelpers';

interface UseEdgePanningProps {
  stageRef: React.RefObject<Konva.Stage>;
  viewport: ViewportState;
  stageSize: { width: number; height: number };
  onViewportChange: (viewport: ViewportState) => void;
  isActive: boolean; // Whether panning should be active (e.g., during drag/resize/create)
  edgeSize?: number; // Distance from edge to trigger panning (in pixels)
  panSpeed?: number; // Base panning speed (pixels per frame)
}

export const useEdgePanning = ({
  stageRef,
  viewport,
  stageSize,
  onViewportChange,
  isActive,
  edgeSize = 50,
  panSpeed = 10,
}: UseEdgePanningProps) => {
  const animationFrameRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

  const performEdgePan = useCallback(() => {
    if (!isActive || !lastPointerPosRef.current) {
      return;
    }

    const pos = lastPointerPosRef.current;
    let dx = 0;
    let dy = 0;

    // Check left edge
    if (pos.x < edgeSize) {
      dx = panSpeed * (1 - pos.x / edgeSize);
    }
    // Check right edge
    else if (pos.x > stageSize.width - edgeSize) {
      dx = -panSpeed * (1 - (stageSize.width - pos.x) / edgeSize);
    }

    // Check top edge
    if (pos.y < edgeSize) {
      dy = panSpeed * (1 - pos.y / edgeSize);
    }
    // Check bottom edge
    else if (pos.y > stageSize.height - edgeSize) {
      dy = -panSpeed * (1 - (stageSize.height - pos.y) / edgeSize);
    }

    // Apply panning if we're near an edge
    if (dx !== 0 || dy !== 0) {
      const newX = viewport.x + dx;
      const newY = viewport.y + dy;

      // Clamp to grid boundaries
      const clampedPos = clampViewportPosition(
        newX,
        newY,
        viewport.scale,
        stageSize.width,
        stageSize.height
      );

      onViewportChange({
        ...viewport,
        x: clampedPos.x,
        y: clampedPos.y,
      });

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(performEdgePan);
    } else {
      // No panning needed, stop the loop
      animationFrameRef.current = null;
    }
  }, [isActive, viewport, stageSize, onViewportChange, edgeSize, panSpeed]);

  // Start/stop the panning loop based on activity
  useEffect(() => {
    if (isActive && lastPointerPosRef.current) {
      // Start panning loop if not already running
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(performEdgePan);
      }
    } else {
      // Stop panning loop
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive, performEdgePan]);

  // Update pointer position for edge detection
  const updatePointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (pos) {
      lastPointerPosRef.current = { x: pos.x, y: pos.y };

      // Trigger panning check if active
      if (isActive && animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(performEdgePan);
      }
    }
  }, [stageRef, isActive, performEdgePan]);

  // Clear pointer position when not active
  useEffect(() => {
    if (!isActive) {
      lastPointerPosRef.current = null;
    }
  }, [isActive]);

  return {
    updatePointerPosition,
  };
};

