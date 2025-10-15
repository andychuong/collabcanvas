import React, { useCallback } from 'react';
import { Circle, Group } from 'react-konva';
import Konva from 'konva';
import { Shape } from '../../types';

interface ResizeHandlesProps {
  shape: Shape;
  onUpdate: (shape: Shape) => void;
}

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ shape, onUpdate }) => {
  if (shape.type !== 'rectangle' || !shape.width || !shape.height) {
    return null;
  }

  const width = shape.width;
  const height = shape.height;
  const strokeColor = shape.stroke || '#000000';

  // Calculate corner positions
  const corners = {
    topLeft: { x: shape.x, y: shape.y },
    topRight: { x: shape.x + width, y: shape.y },
    bottomLeft: { x: shape.x, y: shape.y + height },
    bottomRight: { x: shape.x + width, y: shape.y + height },
  };

  const handleCornerDragMove = useCallback((corner: Corner, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    let newShapeX = shape.x;
    let newShapeY = shape.y;
    let newWidth = width;
    let newHeight = height;

    // Calculate new dimensions based on which corner is being dragged
    switch (corner) {
      case 'topLeft':
        // Dragging top-left: origin moves, bottom-right stays fixed
        newShapeX = newX;
        newShapeY = newY;
        newWidth = (shape.x + width) - newX;
        newHeight = (shape.y + height) - newY;
        break;
      case 'topRight':
        // Dragging top-right: top-left corner stays fixed
        newShapeY = newY;
        newWidth = newX - shape.x;
        newHeight = (shape.y + height) - newY;
        break;
      case 'bottomLeft':
        // Dragging bottom-left: top-right corner stays fixed
        newShapeX = newX;
        newWidth = (shape.x + width) - newX;
        newHeight = newY - shape.y;
        break;
      case 'bottomRight':
        // Dragging bottom-right: top-left corner stays fixed
        newWidth = newX - shape.x;
        newHeight = newY - shape.y;
        break;
    }

    // Prevent negative dimensions
    if (newWidth < 10) newWidth = 10;
    if (newHeight < 10) newHeight = 10;

    // If width or height was at minimum, adjust position back
    if (newWidth === 10 && (corner === 'topLeft' || corner === 'bottomLeft')) {
      newShapeX = shape.x + width - 10;
    }
    if (newHeight === 10 && (corner === 'topLeft' || corner === 'topRight')) {
      newShapeY = shape.y + height - 10;
    }

    onUpdate({
      ...shape,
      x: newShapeX,
      y: newShapeY,
      width: newWidth,
      height: newHeight,
      updatedAt: Date.now(),
    });
  }, [shape, width, height, onUpdate]);

  const handleCornerDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  }, []);

  const handleCornerDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  }, []);

  return (
    <Group>
      {/* Top-left corner */}
      <Circle
        x={corners.topLeft.x}
        y={corners.topLeft.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('topLeft', e)}
        onDragEnd={handleCornerDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'nwse-resize';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />

      {/* Top-right corner */}
      <Circle
        x={corners.topRight.x}
        y={corners.topRight.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('topRight', e)}
        onDragEnd={handleCornerDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'nesw-resize';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />

      {/* Bottom-left corner */}
      <Circle
        x={corners.bottomLeft.x}
        y={corners.bottomLeft.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('bottomLeft', e)}
        onDragEnd={handleCornerDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'nesw-resize';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />

      {/* Bottom-right corner */}
      <Circle
        x={corners.bottomRight.x}
        y={corners.bottomRight.y}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('bottomRight', e)}
        onDragEnd={handleCornerDragEnd}
        hitStrokeWidth={10}
        shadowBlur={5}
        shadowColor="rgba(0,0,0,0.3)"
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'nwse-resize';
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

