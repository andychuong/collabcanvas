import { useState, useEffect, useRef } from 'react';
import { Shape } from '../types';

interface InterpolatedShape extends Shape {
  targetX: number;
  targetY: number;
}

/**
 * Hook to smoothly interpolate shape positions for remote updates
 * Prevents jagged movement when other users drag shapes
 */
export const useInterpolatedShapes = (
  shapes: Shape[],
  isDragging: boolean,
  selectedShapeIds: string[]
) => {
  const [interpolatedShapes, setInterpolatedShapes] = useState<InterpolatedShape[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const isLocalDragRef = useRef<boolean>(false);
  const lastShapesUpdateRef = useRef<number>(Date.now());

  // Track local drag state
  useEffect(() => {
    isLocalDragRef.current = isDragging;
  }, [isDragging]);

  // Update interpolated shapes when source shapes change
  useEffect(() => {
    lastShapesUpdateRef.current = Date.now();

    setInterpolatedShapes((prev) => {
      const newShapes: InterpolatedShape[] = [];
      const prevMap = new Map(prev.map(s => [s.id, s]));

      shapes.forEach((shape) => {
        const existing = prevMap.get(shape.id);
        
        // If this shape is being dragged locally, use exact position (no interpolation)
        if (isLocalDragRef.current && selectedShapeIds.includes(shape.id)) {
          newShapes.push({
            ...shape,
            targetX: shape.x,
            targetY: shape.y,
          });
          return;
        }

        if (existing) {
          // For existing shapes, check if position changed
          const positionChanged = existing.targetX !== shape.x || existing.targetY !== shape.y;
          
          if (positionChanged) {
            // Position changed - start interpolating to new target
            newShapes.push({
              ...existing,
              ...shape, // Update all properties except x, y
              x: existing.x, // Keep current animated position
              y: existing.y,
              targetX: shape.x, // New target position
              targetY: shape.y,
            });
          } else {
            // Position unchanged - keep interpolating if not at target
            newShapes.push({
              ...existing,
              ...shape, // Update other properties that might have changed
              x: existing.x,
              y: existing.y,
              targetX: shape.x,
              targetY: shape.y,
            });
          }
        } else {
          // New shape - start at target position (no animation for initial placement)
          newShapes.push({
            ...shape,
            targetX: shape.x,
            targetY: shape.y,
          });
        }
      });

      return newShapes;
    });
  }, [shapes, selectedShapeIds]);

  // Smooth interpolation animation loop
  useEffect(() => {
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      setInterpolatedShapes((prev) => {
        const updated = prev.map((shape) => {
          // If locally dragging this shape, don't interpolate
          if (isLocalDragRef.current && selectedShapeIds.includes(shape.id)) {
            return shape;
          }

          const dx = shape.targetX - shape.x;
          const dy = shape.targetY - shape.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // If we're close enough, snap to target
          if (distance < 0.5) {
            if (shape.x === shape.targetX && shape.y === shape.targetY) {
              return shape;
            }
            return { ...shape, x: shape.targetX, y: shape.targetY };
          }

          // Smooth interpolation with adaptive easing
          // Use faster interpolation for larger distances to feel responsive
          const lerpFactor = distance > 50 ? 0.35 : 0.25;
          const newX = shape.x + dx * lerpFactor;
          const newY = shape.y + dy * lerpFactor;

          return { ...shape, x: newX, y: newY };
        });

        return updated;
      });

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start continuous animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedShapeIds]);

  // Return shapes without the interpolation metadata
  return interpolatedShapes.map(({ targetX, targetY, ...shape }) => shape as Shape);
};

