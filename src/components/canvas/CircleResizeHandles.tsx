import React, { useCallback, useRef, useEffect } from 'react';
import { Circle, Group } from 'react-konva';
import Konva from 'konva';
import { Shape } from '../../types';

interface CircleResizeHandlesProps {
  shape: Shape;
  onUpdate: (shape: Shape, immediate?: boolean) => void;
}

type Direction = 'top' | 'right' | 'bottom' | 'left';

export const CircleResizeHandles: React.FC<CircleResizeHandlesProps> = ({ shape, onUpdate }) => {
  const groupRef = useRef<Konva.Group>(null);

  // Update group position to match the circle's real-time position
  useEffect(() => {
    if (shape.type !== 'circle' || !shape.radius) return;
    if (!groupRef.current) return;

    const stage = groupRef.current.getStage();
    if (!stage) return;

    const circleNode = stage.findOne(`#${shape.id}`) as Konva.Circle;
    if (!circleNode) return;

    // Sync handle group position with circle during drag
    const syncPosition = () => {
      if (groupRef.current && circleNode) {
        groupRef.current.position({
          x: circleNode.x(),
          y: circleNode.y()
        });
      }
    };

    // Listen to the circle's drag events
    circleNode.on('dragmove', syncPosition);

    // Initial sync
    syncPosition();

    return () => {
      circleNode.off('dragmove', syncPosition);
    };
  }, [shape.id, shape.x, shape.y, shape.type, shape.radius]);

  const calculateNewRadius = useCallback((direction: Direction, e: Konva.KonvaEventObject<DragEvent>) => {
    if (shape.type !== 'circle' || !shape.radius) return null;
    const node = e.target;
    const stage = node.getStage();
    if (!stage) return null;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;

    // Get the circle's current position
    const circleNode = stage.findOne(`#${shape.id}`) as Konva.Circle;
    const circleX = circleNode ? circleNode.x() : shape.x;
    const circleY = circleNode ? circleNode.y() : shape.y;

    // Calculate the position in canvas coordinates
    const scale = stage.scaleX();
    const stagePos = stage.position();
    const mouseX = (pointerPos.x - stagePos.x) / scale;
    const mouseY = (pointerPos.y - stagePos.y) / scale;

    // Calculate distance from center to mouse position
    const dx = mouseX - circleX;
    const dy = mouseY - circleY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Use this distance as the new radius
    const newRadius = Math.max(distance, 5);

    // Calculate the new position for this handle relative to center
    let newHandlePos: { x: number; y: number };
    switch (direction) {
      case 'top':
        newHandlePos = { x: 0, y: -newRadius };
        break;
      case 'right':
        newHandlePos = { x: newRadius, y: 0 };
        break;
      case 'bottom':
        newHandlePos = { x: 0, y: newRadius };
        break;
      case 'left':
        newHandlePos = { x: -newRadius, y: 0 };
        break;
    }

    // Reset the handle position to stay on the perimeter
    node.position(newHandlePos);

    return newRadius;
  }, [shape]);

  const handleDragMove = useCallback((direction: Direction, e: Konva.KonvaEventObject<DragEvent>) => {
    const newRadius = calculateNewRadius(direction, e);
    if (newRadius === null) return;

    // Use throttled update during drag (immediate=false)
    onUpdate({
      ...shape,
      radius: newRadius,
      updatedAt: Date.now(),
    }, false);
  }, [shape, calculateNewRadius, onUpdate]);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Check if middle mouse button is pressed - prevent dragging to allow panning
    const evt = e.evt as MouseEvent;
    const isMiddleButton = evt.button === 1;
    
    if (isMiddleButton) {
      e.target.stopDrag();
      return;
    }
    
    e.cancelBubble = true;
  }, []);

  const handleDragEnd = useCallback((direction: Direction, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const newRadius = calculateNewRadius(direction, e);
    if (newRadius === null) return;

    // Use immediate update on drag end for undo/redo
    onUpdate({
      ...shape,
      radius: newRadius,
      updatedAt: Date.now(),
    }, true);
  }, [shape, calculateNewRadius, onUpdate]);

  // After all hooks, check if we should render
  if (shape.type !== 'circle' || !shape.radius) {
    return null;
  }

  const radius = shape.radius;
  const strokeColor = shape.stroke || '#000000';

  // Calculate handle positions relative to center (0, 0) since Group is positioned at circle center
  const handles = {
    top: { x: 0, y: -radius },
    right: { x: radius, y: 0 },
    bottom: { x: 0, y: radius },
    left: { x: -radius, y: 0 },
  };

  return (
    <Group ref={groupRef} x={shape.x} y={shape.y}>
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
        onDragEnd={(e) => handleDragEnd('top', e)}
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
        onDragEnd={(e) => handleDragEnd('right', e)}
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
        onDragEnd={(e) => handleDragEnd('bottom', e)}
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
        onDragEnd={(e) => handleDragEnd('left', e)}
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

