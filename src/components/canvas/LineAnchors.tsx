import React, { useCallback } from 'react';
import { Circle, Group } from 'react-konva';
import Konva from 'konva';
import { Shape } from '../../types';

interface LineAnchorsProps {
  shape: Shape;
  onUpdate: (shape: Shape, immediate?: boolean) => void;
}

export const LineAnchors: React.FC<LineAnchorsProps> = ({ shape, onUpdate }) => {
  if (shape.type !== 'line' || !shape.points || shape.points.length < 4) {
    return null;
  }

  const points = shape.points;
  const lineColor = shape.stroke || '#000000';
  
  // Calculate absolute positions of anchor points
  const startX = shape.x + points[0];
  const startY = shape.y + points[1];
  const endX = shape.x + points[2];
  const endY = shape.y + points[3];

  const handleAnchorDragMove = useCallback((anchorIndex: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Update the points array based on which anchor is being dragged
    let newPoints: number[];

    if (anchorIndex === 0) {
      // Dragging start point (first anchor)
      // The relative coordinates for the start point
      newPoints = [
        newX - shape.x,
        newY - shape.y,
        points[2], // end point stays the same
        points[3]
      ];
    } else {
      // Dragging end point (second anchor)
      // The relative coordinates for the end point
      newPoints = [
        points[0], // start point stays the same
        points[1],
        newX - shape.x,
        newY - shape.y
      ];
    }

    // Update the shape in real-time with throttled updates
    onUpdate({
      ...shape,
      points: newPoints,
      updatedAt: Date.now(),
    }, false);
  }, [shape, points, onUpdate]);

  const handleAnchorDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent the line itself from being dragged
    e.cancelBubble = true;
  }, []);

  const handleAnchorDragEnd = useCallback((anchorIndex: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Finalize the update
    let newPoints: number[];
    
    if (anchorIndex === 0) {
      newPoints = [
        newX - shape.x,
        newY - shape.y,
        points[2],
        points[3]
      ];
    } else {
      newPoints = [
        points[0],
        points[1],
        newX - shape.x,
        newY - shape.y
      ];
    }

    // Use immediate update on drag end for undo/redo
    onUpdate({
      ...shape,
      points: newPoints,
      updatedAt: Date.now(),
    }, true);
  }, [shape, points, onUpdate]);

  return (
    <Group>
      {/* Start point anchor */}
      <Circle
        x={startX}
        y={startY}
        radius={6}
        fill="white"
        stroke={lineColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleAnchorDragStart}
        onDragMove={(e) => handleAnchorDragMove(0, e)}
        onDragEnd={(e) => handleAnchorDragEnd(0, e)}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />
      
      {/* End point anchor */}
      <Circle
        x={endX}
        y={endY}
        radius={6}
        fill="white"
        stroke={lineColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleAnchorDragStart}
        onDragMove={(e) => handleAnchorDragMove(1, e)}
        onDragEnd={(e) => handleAnchorDragEnd(1, e)}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />
    </Group>
  );
};

