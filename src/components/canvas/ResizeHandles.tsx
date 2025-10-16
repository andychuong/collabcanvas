import React, { useCallback } from 'react';
import { Circle, Group } from 'react-konva';
import Konva from 'konva';
import { Shape } from '../../types';

interface ResizeHandlesProps {
  shape: Shape;
  onUpdate: (shape: Shape, immediate?: boolean) => void;
  onResizingChange?: (isResizing: boolean) => void;
}

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type Edge = 'top' | 'bottom' | 'left' | 'right';

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ shape, onUpdate, onResizingChange }) => {
  if (shape.type !== 'rectangle' || !shape.width || !shape.height) {
    return null;
  }

  const width = shape.width;
  const height = shape.height;
  const strokeColor = shape.stroke || '#000000';

  const calculateNewDimensions = useCallback((corner: Corner, localX: number, localY: number) => {
    // localX and localY are in the rotated coordinate space of the Group
    // Calculate new dimensions based on distance from center
    let newWidth = width;
    let newHeight = height;

    switch (corner) {
      case 'topLeft':
        newWidth = Math.abs(localX) * 2;
        newHeight = Math.abs(localY) * 2;
        break;
      case 'topRight':
        newWidth = Math.abs(localX) * 2;
        newHeight = Math.abs(localY) * 2;
        break;
      case 'bottomLeft':
        newWidth = Math.abs(localX) * 2;
        newHeight = Math.abs(localY) * 2;
        break;
      case 'bottomRight':
        newWidth = Math.abs(localX) * 2;
        newHeight = Math.abs(localY) * 2;
        break;
    }

    // Prevent dimensions too small
    if (newWidth < 10) newWidth = 10;
    if (newHeight < 10) newHeight = 10;

    // Center position stays the same (shape.x, shape.y)
    return { newShapeX: shape.x, newShapeY: shape.y, newWidth, newHeight };
  }, [shape, width, height]);

  const calculateNewDimensionsEdge = useCallback((edge: Edge, localX: number, localY: number) => {
    // localX and localY are in the rotated coordinate space of the Group
    // The opposite edge should stay fixed in local space
    
    const rotation = (shape.rotation || 0) * Math.PI / 180; // Convert to radians
    let newWidth = width;
    let newHeight = height;
    let localOffsetX = 0;
    let localOffsetY = 0;

    switch (edge) {
      case 'top':
        // Top edge being dragged to localY, bottom edge stays at height/2
        newHeight = height / 2 - localY; // Distance from dragged top to fixed bottom
        // New center in local Y = midpoint between localY and height/2
        localOffsetY = (localY + height / 2) / 2;
        break;
      case 'bottom':
        // Bottom edge being dragged to localY, top edge stays at -height/2
        newHeight = localY - (-height / 2); // Distance from fixed top to dragged bottom
        // New center in local Y = midpoint between -height/2 and localY
        localOffsetY = (-height / 2 + localY) / 2;
        break;
      case 'left':
        // Left edge being dragged to localX, right edge stays at width/2
        newWidth = width / 2 - localX; // Distance from dragged left to fixed right
        // New center in local X = midpoint between localX and width/2
        localOffsetX = (localX + width / 2) / 2;
        break;
      case 'right':
        // Right edge being dragged to localX, left edge stays at -width/2
        newWidth = localX - (-width / 2); // Distance from fixed left to dragged right
        // New center in local X = midpoint between -width/2 and localX
        localOffsetX = (-width / 2 + localX) / 2;
        break;
    }

    // Prevent dimensions too small
    if (newWidth < 10) newWidth = 10;
    if (newHeight < 10) newHeight = 10;

    // Convert local offset to world coordinates using rotation
    const worldOffsetX = localOffsetX * Math.cos(rotation) - localOffsetY * Math.sin(rotation);
    const worldOffsetY = localOffsetX * Math.sin(rotation) + localOffsetY * Math.cos(rotation);

    // Apply offset to shape center
    const newShapeX = shape.x + worldOffsetX;
    const newShapeY = shape.y + worldOffsetY;

    return { newShapeX, newShapeY, newWidth, newHeight };
  }, [shape, width, height]);

  const handleCornerDragMove = useCallback((corner: Corner, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    const { newShapeX, newShapeY, newWidth, newHeight } = calculateNewDimensions(corner, newX, newY);

    // Use throttled update during drag (immediate=false)
    onUpdate({
      ...shape,
      x: newShapeX,
      y: newShapeY,
      width: newWidth,
      height: newHeight,
      updatedAt: Date.now(),
    }, false);
  }, [shape, calculateNewDimensions, onUpdate]);

  const handleCornerDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Check if middle mouse button is pressed - prevent dragging to allow panning
    const evt = e.evt as MouseEvent;
    const isMiddleButton = evt.button === 1;
    
    if (isMiddleButton) {
      e.target.stopDrag();
      return;
    }
    
    e.cancelBubble = true;
    
    // Notify that resizing has started
    if (onResizingChange) {
      onResizingChange(true);
    }
  }, [onResizingChange]);

  const handleCornerDragEnd = useCallback((corner: Corner, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    const { newShapeX, newShapeY, newWidth, newHeight } = calculateNewDimensions(corner, newX, newY);

    // Use immediate update on drag end for undo/redo
    onUpdate({
      ...shape,
      x: newShapeX,
      y: newShapeY,
      width: newWidth,
      height: newHeight,
      updatedAt: Date.now(),
    }, true);
    
    // Notify that resizing has ended
    if (onResizingChange) {
      onResizingChange(false);
    }
  }, [shape, calculateNewDimensions, onUpdate, onResizingChange]);

  const handleEdgeDragMove = useCallback((edge: Edge, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    const { newShapeX, newShapeY, newWidth, newHeight } = calculateNewDimensionsEdge(edge, newX, newY);

    // Use throttled update during drag (immediate=false)
    onUpdate({
      ...shape,
      x: newShapeX,
      y: newShapeY,
      width: newWidth,
      height: newHeight,
      updatedAt: Date.now(),
    }, false);

    // Anchor positions are automatically updated by React re-render
    // No need to manually reposition since we're in the Group's local coordinate system
  }, [shape, calculateNewDimensionsEdge, onUpdate]);

  const handleEdgeDragEnd = useCallback((edge: Edge, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    const { newShapeX, newShapeY, newWidth, newHeight } = calculateNewDimensionsEdge(edge, newX, newY);

    // Use immediate update on drag end for undo/redo
    onUpdate({
      ...shape,
      x: newShapeX,
      y: newShapeY,
      width: newWidth,
      height: newHeight,
      updatedAt: Date.now(),
    }, true);
    
    // Notify that resizing has ended
    if (onResizingChange) {
      onResizingChange(false);
    }
  }, [shape, calculateNewDimensionsEdge, onUpdate, onResizingChange]);

  return (
    <Group
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation || 0}
    >
      {/* Top-left corner */}
      <Circle
        x={-width / 2}
        y={-height / 2}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('topLeft', e)}
        onDragEnd={(e) => handleCornerDragEnd('topLeft', e)}
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
        x={width / 2}
        y={-height / 2}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('topRight', e)}
        onDragEnd={(e) => handleCornerDragEnd('topRight', e)}
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
        x={-width / 2}
        y={height / 2}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('bottomLeft', e)}
        onDragEnd={(e) => handleCornerDragEnd('bottomLeft', e)}
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
        x={width / 2}
        y={height / 2}
        radius={6}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleCornerDragMove('bottomRight', e)}
        onDragEnd={(e) => handleCornerDragEnd('bottomRight', e)}
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

      {/* Top edge anchor */}
      <Circle
        x={0}
        y={-height / 2}
        radius={5}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        dragBoundFunc={(pos) => {
          // Keep x at 0, allow y movement
          return { x: 0, y: pos.y };
        }}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleEdgeDragMove('top', e)}
        onDragEnd={(e) => handleEdgeDragEnd('top', e)}
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

      {/* Bottom edge anchor */}
      <Circle
        x={0}
        y={height / 2}
        radius={5}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        dragBoundFunc={(pos) => {
          // Keep x at 0, allow y movement
          return { x: 0, y: pos.y };
        }}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleEdgeDragMove('bottom', e)}
        onDragEnd={(e) => handleEdgeDragEnd('bottom', e)}
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

      {/* Left edge anchor */}
      <Circle
        x={-width / 2}
        y={0}
        radius={5}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        dragBoundFunc={(pos) => {
          // Keep y at 0, allow x movement
          return { x: pos.x, y: 0 };
        }}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleEdgeDragMove('left', e)}
        onDragEnd={(e) => handleEdgeDragEnd('left', e)}
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

      {/* Right edge anchor */}
      <Circle
        x={width / 2}
        y={0}
        radius={5}
        fill="white"
        stroke={strokeColor}
        strokeWidth={2}
        draggable={true}
        dragBoundFunc={(pos) => {
          // Keep y at 0, allow x movement
          return { x: pos.x, y: 0 };
        }}
        onDragStart={handleCornerDragStart}
        onDragMove={(e) => handleEdgeDragMove('right', e)}
        onDragEnd={(e) => handleEdgeDragEnd('right', e)}
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

