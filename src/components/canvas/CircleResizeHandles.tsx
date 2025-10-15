import React, { useCallback } from 'react';
import { Circle, Group } from 'react-konva';
import Konva from 'konva';
import { Shape } from '../../types';

interface CircleResizeHandlesProps {
  shape: Shape;
  onUpdate: (shape: Shape) => void;
}

type Direction = 'top' | 'right' | 'bottom' | 'left';

export const CircleResizeHandles: React.FC<CircleResizeHandlesProps> = ({ shape, onUpdate }) => {
  if (shape.type !== 'circle' || !shape.radius) {
    return null;
  }

  const radius = shape.radius;
  const strokeColor = shape.stroke || '#000000';

  // Calculate handle positions at cardinal directions
  const handles = {
    top: { x: shape.x, y: shape.y - radius },
    right: { x: shape.x + radius, y: shape.y },
    bottom: { x: shape.x, y: shape.y + radius },
    left: { x: shape.x - radius, y: shape.y },
  };

  const handleDragMove = useCallback((direction: Direction, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const stage = node.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Calculate the position in canvas coordinates
    const scale = stage.scaleX();
    const stagePos = stage.position();
    const mouseX = (pointerPos.x - stagePos.x) / scale;
    const mouseY = (pointerPos.y - stagePos.y) / scale;

    // Calculate distance from center to mouse position
    const dx = mouseX - shape.x;
    const dy = mouseY - shape.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Use this distance as the new radius
    const newRadius = Math.max(distance, 5);

    // Calculate the new position for this handle based on its direction
    let newHandlePos: { x: number; y: number };
    switch (direction) {
      case 'top':
        newHandlePos = { x: shape.x, y: shape.y - newRadius };
        break;
      case 'right':
        newHandlePos = { x: shape.x + newRadius, y: shape.y };
        break;
      case 'bottom':
        newHandlePos = { x: shape.x, y: shape.y + newRadius };
        break;
      case 'left':
        newHandlePos = { x: shape.x - newRadius, y: shape.y };
        break;
    }

    // Reset the handle position to stay on the perimeter
    node.position(newHandlePos);

    onUpdate({
      ...shape,
      radius: newRadius,
      updatedAt: Date.now(),
    });
  }, [shape, onUpdate]);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  }, []);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  }, []);

  return (
    <Group>
      {/* Top handle */}
      <Circle
        x={handles.top.x}
        y={handles.top.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart}
        onDragMove={(e) => handleDragMove('top', e)}
        onDragEnd={handleDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'ns-resize';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />

      {/* Right handle */}
      <Circle
        x={handles.right.x}
        y={handles.right.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart}
        onDragMove={(e) => handleDragMove('right', e)}
        onDragEnd={handleDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'ew-resize';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />

      {/* Bottom handle */}
      <Circle
        x={handles.bottom.x}
        y={handles.bottom.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart}
        onDragMove={(e) => handleDragMove('bottom', e)}
        onDragEnd={handleDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'ns-resize';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />

      {/* Left handle */}
      <Circle
        x={handles.left.x}
        y={handles.left.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart}
        onDragMove={(e) => handleDragMove('left', e)}
        onDragEnd={handleDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'ew-resize';
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

