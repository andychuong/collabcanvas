import React from 'react';
import { Layer, Rect, Circle, Text as KonvaText, Line } from 'react-konva';
import Konva from 'konva';
import { Shape } from '../../types';
import { darkenColor } from '../../utils/canvasHelpers';

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
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  shapes,
  selectedShapeId,
  selectedShapeIds,
  editingTextId,
  onShapeClick,
  onShapeDragStart,
  onShapeDragMove,
  onShapeDragEnd,
  onTextDblClick,
}) => {
  return (
    <Layer>
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId || selectedShapeIds.includes(shape.id);

        if (shape.type === 'rectangle') {
          const darkerBorderColor = isSelected && shape.fill ? darkenColor(shape.fill, 0.4) : undefined;
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
              draggable={true}
              onClick={(e) => onShapeClick(shape.id, e)}
              onDragStart={(e) => onShapeDragStart(shape.id, e)}
              onDragMove={(e) => onShapeDragMove(shape, e)}
              onDragEnd={(e) => onShapeDragEnd(shape, e)}
              stroke={darkerBorderColor}
              strokeWidth={isSelected ? 1.5 : 0}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor={darkerBorderColor}
            />
          );
        }

        if (shape.type === 'circle') {
          const darkerBorderColor = isSelected && shape.fill ? darkenColor(shape.fill, 0.4) : undefined;
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
              stroke={darkerBorderColor}
              strokeWidth={isSelected ? 1.5 : 0}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor={darkerBorderColor}
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
              shadowBlur={isSelected ? 10 : 0}
              shadowColor={darkerBorderColor}
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
              draggable={true}
              onClick={(e) => onShapeClick(shape.id, e)}
              onDragStart={(e) => onShapeDragStart(shape.id, e)}
              onDragMove={(e) => onShapeDragMove(shape, e)}
              onDragEnd={(e) => onShapeDragEnd(shape, e)}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor={darkerShadowColor}
              hitStrokeWidth={isSelected ? 15 : 10}
            />
          );
        }

        return null;
      })}
    </Layer>
  );
};

