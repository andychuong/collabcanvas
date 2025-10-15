import React from 'react';
import { Layer, Rect, Circle, Text as KonvaText, Line } from 'react-konva';
import Konva from 'konva';
import { Shape } from '../../types';
import { darkenColor } from '../../utils/canvasHelpers';
import { LineAnchors } from './LineAnchors';
import { ResizeHandles } from './ResizeHandles';
import { CircleResizeHandles } from './CircleResizeHandles';

interface ShapeRendererProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  selectedShapeIds: string[];
  editingTextId: string | null;
  onShapeClick: (shapeId: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onShapeDragStart: (shapeId: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onShapeDragMove: (shape: Shape, e: Konva.KonvaEventObject<DragEvent>) => void;
  onShapeDragEnd: (shape: Shape, e: Konva.KonvaEventObject<DragEvent>) => void;
  onTextDblClick: (shape: Shape, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onShapeUpdate: (shape: Shape) => void;
  otherUsersSelections?: Map<string, { shapeIds: string[]; color: string; userName: string }>;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = React.memo(({
  shapes,
  selectedShapeId,
  selectedShapeIds,
  editingTextId,
  onShapeClick,
  onShapeDragStart,
  onShapeDragMove,
  onShapeDragEnd,
  onTextDblClick,
  onShapeUpdate,
  otherUsersSelections = new Map(),
}) => {
  // Check if a shape is selected by another user
  const getOtherUserSelection = (shapeId: string): { color: string; userName: string } | null => {
    for (const [, selection] of otherUsersSelections) {
      if (selection.shapeIds.includes(shapeId)) {
        return { color: selection.color, userName: selection.userName };
      }
    }
    return null;
  };
  return (
    <Layer>
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId || selectedShapeIds.includes(shape.id);
        const otherUserSelection = getOtherUserSelection(shape.id);

        if (shape.type === 'rectangle') {
          const hasStroke = shape.stroke && shape.strokeWidth;
          const darkerBorderColor = isSelected && (hasStroke ? shape.stroke : shape.fill) ? darkenColor(hasStroke ? shape.stroke! : shape.fill, 0.4) : undefined;
          return (
            <Rect
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width || 100}
              height={shape.height || 100}
              fill={shape.fill}
              rotation={shape.rotation || 0}
              draggable={!isSelected}
              onClick={(e) => onShapeClick(shape.id, e)}
              onDragStart={(e) => onShapeDragStart(shape.id, e)}
              onDragMove={(e) => onShapeDragMove(shape, e)}
              onDragEnd={(e) => onShapeDragEnd(shape, e)}
              stroke={hasStroke ? shape.stroke : darkerBorderColor}
              strokeWidth={hasStroke ? shape.strokeWidth : (isSelected ? 1.5 : 0)}
              shadowBlur={isSelected ? 10 : (otherUserSelection ? 15 : 0)}
              shadowColor={isSelected ? darkerBorderColor : (otherUserSelection ? otherUserSelection.color : undefined)}
              shadowOpacity={otherUserSelection ? 0.8 : undefined}
            />
          );
        }

        if (shape.type === 'circle') {
          const hasStroke = shape.stroke && shape.strokeWidth;
          const darkerBorderColor = isSelected && (hasStroke ? shape.stroke : shape.fill) ? darkenColor(hasStroke ? shape.stroke! : shape.fill, 0.4) : undefined;
          return (
            <Circle
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              radius={shape.radius || 50}
              fill={shape.fill}
              draggable={true}
              onClick={(e) => onShapeClick(shape.id, e)}
              onDragStart={(e) => onShapeDragStart(shape.id, e)}
              onDragMove={(e) => onShapeDragMove(shape, e)}
              onDragEnd={(e) => onShapeDragEnd(shape, e)}
              stroke={hasStroke ? shape.stroke : darkerBorderColor}
              strokeWidth={hasStroke ? shape.strokeWidth : (isSelected ? 1.5 : 0)}
              shadowBlur={isSelected ? 10 : (otherUserSelection ? 15 : 0)}
              shadowColor={isSelected ? darkerBorderColor : (otherUserSelection ? otherUserSelection.color : undefined)}
              shadowOpacity={otherUserSelection ? 0.8 : undefined}
            />
          );
        }

        if (shape.type === 'text') {
          const darkerBorderColor = isSelected && shape.fill ? darkenColor(shape.fill, 0.4) : undefined;
          const isEditing = editingTextId === shape.id;
          
          return (
            <KonvaText
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              text={shape.text || 'Text'}
              fontSize={shape.fontSize || 24}
              fill={shape.fill}
              draggable={!isEditing}
              visible={!isEditing}
              onClick={(e) => !isEditing && onShapeClick(shape.id, e)}
              onDblClick={(e) => {
                e.cancelBubble = true;
                onTextDblClick(shape, e);
              }}
              onDragStart={(e) => onShapeDragStart(shape.id, e)}
              onDragMove={(e) => onShapeDragMove(shape, e)}
              onDragEnd={(e) => onShapeDragEnd(shape, e)}
              shadowBlur={isSelected ? 10 : (otherUserSelection ? 15 : 0)}
              shadowColor={isSelected ? darkerBorderColor : (otherUserSelection ? otherUserSelection.color : undefined)}
              shadowOpacity={otherUserSelection ? 0.8 : undefined}
            />
          );
        }

        if (shape.type === 'line') {
          const lineColor = shape.stroke || '#000000';
          const darkerShadowColor = isSelected ? darkenColor(lineColor, 0.3) : undefined;
          return (
            <Line
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              points={shape.points || [0, 0, 100, 100]}
              stroke={lineColor}
              strokeWidth={isSelected ? (shape.strokeWidth || 2) + 1 : (shape.strokeWidth || 2)}
              draggable={!isSelected}
              onClick={(e) => onShapeClick(shape.id, e)}
              onDragStart={(e) => onShapeDragStart(shape.id, e)}
              onDragMove={(e) => onShapeDragMove(shape, e)}
              onDragEnd={(e) => onShapeDragEnd(shape, e)}
              shadowBlur={isSelected ? 10 : (otherUserSelection ? 15 : 0)}
              shadowColor={isSelected ? darkerShadowColor : (otherUserSelection ? otherUserSelection.color : undefined)}
              shadowOpacity={otherUserSelection ? 0.8 : undefined}
              hitStrokeWidth={isSelected ? 15 : 10}
            />
          );
        }

        return null;
      })}
      
      {/* Render anchor points for selected lines */}
      {shapes
        .filter(shape => shape.type === 'line' && (shape.id === selectedShapeId || selectedShapeIds.includes(shape.id)))
        .map(shape => (
          <LineAnchors
            key={`anchors-${shape.id}`}
            shape={shape}
            onUpdate={onShapeUpdate}
          />
        ))
      }
      
      {/* Render resize handles for selected rectangles */}
      {shapes
        .filter(shape => shape.type === 'rectangle' && (shape.id === selectedShapeId || selectedShapeIds.includes(shape.id)))
        .map(shape => (
          <ResizeHandles
            key={`handles-${shape.id}`}
            shape={shape}
            onUpdate={onShapeUpdate}
          />
        ))
      }
      
      {/* Render resize handles for selected circles */}
      {shapes
        .filter(shape => shape.type === 'circle' && (shape.id === selectedShapeId || selectedShapeIds.includes(shape.id)))
        .map(shape => (
          <CircleResizeHandles
            key={`circle-handles-${shape.id}`}
            shape={shape}
            onUpdate={onShapeUpdate}
          />
        ))
      }
    </Layer>
  );
});

