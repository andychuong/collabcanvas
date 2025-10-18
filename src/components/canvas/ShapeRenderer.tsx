import React, { Fragment } from 'react';
import { Layer, Rect, Circle, Text as KonvaText, Line, Arrow } from 'react-konva';
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
  isDragging?: boolean;
  onResizingChange?: (isResizing: boolean) => void;
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
  isDragging = false,
  onResizingChange,
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
          const width = shape.width || 100;
          const height = shape.height || 100;
          const strokeColor = shape.stroke || '#000000';
          const darkerBorderColor = isSelected ? darkenColor(strokeColor, 0.4) : undefined;
          
          return (
            <Fragment key={shape.id}>
              {/* Outer glow for other users' selections */}
              {otherUserSelection && (
                <>
                  {/* Glow layer */}
                  <Rect
                    x={shape.x}
                    y={shape.y}
                    width={width}
                    height={height}
                    offsetX={width / 2}
                    offsetY={height / 2}
                    rotation={shape.rotation || 0}
                    stroke={otherUserSelection.color}
                    strokeWidth={8}
                    opacity={0.4}
                    listening={false}
                    shadowBlur={25}
                    shadowColor={otherUserSelection.color}
                    shadowOpacity={1}
                  />
                  {/* Solid outline */}
                  <Rect
                    x={shape.x}
                    y={shape.y}
                    width={width}
                    height={height}
                    offsetX={width / 2}
                    offsetY={height / 2}
                    rotation={shape.rotation || 0}
                    stroke={otherUserSelection.color}
                    strokeWidth={2}
                    opacity={0.9}
                    listening={false}
                  />
                </>
              )}
              <Rect
                id={shape.id}
                x={shape.x}
                y={shape.y}
                width={width}
                height={height}
                offsetX={width / 2}
                offsetY={height / 2}
                fill={shape.fill}
                rotation={shape.rotation || 0}
                draggable={isSelected}
                onClick={(e) => onShapeClick(shape.id, e)}
                onDragStart={(e) => onShapeDragStart(shape.id, e)}
                onDragMove={(e) => onShapeDragMove(shape, e)}
                onDragEnd={(e) => onShapeDragEnd(shape, e)}
                stroke={strokeColor}
                strokeWidth={shape.strokeWidth || 0}
                shadowBlur={isSelected ? 10 : 0}
                shadowColor={isSelected ? darkerBorderColor : undefined}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'grab';
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                }}
              />
            </Fragment>
          );
        }

        if (shape.type === 'arrow') {
          const width = shape.width || 100;
          const height = shape.height || 100;
          const strokeColor = shape.stroke || '#000000';
          const darkerBorderColor = isSelected ? darkenColor(strokeColor, 0.4) : undefined;
          
          // Arrow head dimensions
          const pointerLength = Math.min(width * 0.2, height * 0.6); // 20% of width or 60% of height, whichever is smaller
          const pointerWidth = height * 0.8; // 80% of height for arrow head width
          
          // Calculate proportional stroke width based on arrow height
          // Scale the tail thickness with the arrow head size
          // Use ranges: height 20-40 → stroke 2-4, height 40-100 → stroke 4-8, height 100+ → stroke 8-12
          let calculatedStrokeWidth: number;
          if (height <= 40) {
            calculatedStrokeWidth = 2 + (height - 20) / 20 * 2; // 2-4px
          } else if (height <= 100) {
            calculatedStrokeWidth = 4 + (height - 40) / 60 * 4; // 4-8px
          } else {
            calculatedStrokeWidth = 8 + Math.min((height - 100) / 100 * 4, 4); // 8-12px max
          }
          const scaledStrokeWidth = Math.max(2, Math.min(12, calculatedStrokeWidth)); // Clamp between 2-12px
          
          // Calculate arrow points: account for arrow head so total visual width = width
          // Arrow head extends from the end point, so we need to subtract pointerLength
          const points = [-width / 2, 0, width / 2 - pointerLength, 0];
          
          return (
            <Fragment key={shape.id}>
              {/* Outer glow for other users' selections */}
              {otherUserSelection && (
                <>
                  {/* Glow layer */}
                  <Arrow
                    x={shape.x}
                    y={shape.y}
                    points={points}
                    rotation={shape.rotation || 0}
                    stroke={otherUserSelection.color}
                    strokeWidth={scaledStrokeWidth + 6}
                    opacity={0.4}
                    listening={false}
                    shadowBlur={25}
                    shadowColor={otherUserSelection.color}
                    shadowOpacity={1}
                    pointerLength={pointerLength}
                    pointerWidth={pointerWidth}
                    fill={otherUserSelection.color}
                  />
                  {/* Solid outline */}
                  <Arrow
                    x={shape.x}
                    y={shape.y}
                    points={points}
                    rotation={shape.rotation || 0}
                    stroke={otherUserSelection.color}
                    strokeWidth={scaledStrokeWidth + 2}
                    opacity={0.9}
                    listening={false}
                    pointerLength={pointerLength}
                    pointerWidth={pointerWidth}
                    fill={otherUserSelection.color}
                  />
                </>
              )}
              <Arrow
                id={shape.id}
                x={shape.x}
                y={shape.y}
                points={points}
                rotation={shape.rotation || 0}
                fill={shape.fill}
                stroke={strokeColor}
                strokeWidth={scaledStrokeWidth}
                pointerLength={pointerLength}
                pointerWidth={pointerWidth}
                draggable={isSelected}
                onClick={(e) => onShapeClick(shape.id, e)}
                onDragStart={(e) => onShapeDragStart(shape.id, e)}
                onDragMove={(e) => onShapeDragMove(shape, e)}
                onDragEnd={(e) => onShapeDragEnd(shape, e)}
                shadowBlur={isSelected ? 10 : 0}
                shadowColor={isSelected ? darkerBorderColor : undefined}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'grab';
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                }}
              />
            </Fragment>
          );
        }

        if (shape.type === 'circle') {
          const hasStroke = shape.stroke && shape.strokeWidth;
          const darkerBorderColor = isSelected && (hasStroke ? shape.stroke : shape.fill) ? darkenColor(hasStroke ? shape.stroke! : shape.fill, 0.4) : undefined;
          
          return (
            <Fragment key={shape.id}>
              {/* Outer glow for other users' selections - VERY VISIBLE */}
              {otherUserSelection && (
                <>
                  {/* Thick glow layer */}
                  <Circle
                    x={shape.x}
                    y={shape.y}
                    radius={(shape.radius || 50) + 5}
                    stroke={otherUserSelection.color}
                    strokeWidth={15}
                    opacity={0.5}
                    listening={false}
                    shadowBlur={30}
                    shadowColor={otherUserSelection.color}
                    shadowOpacity={1}
                  />
                  {/* Solid bright outline */}
                  <Circle
                    x={shape.x}
                    y={shape.y}
                    radius={(shape.radius || 50) + 2}
                    stroke={otherUserSelection.color}
                    strokeWidth={5}
                    opacity={1}
                    listening={false}
                  />
                </>
              )}
              <Circle
                id={shape.id}
                x={shape.x}
                y={shape.y}
                radius={shape.radius || 50}
                fill={shape.fill}
                draggable={isSelected}
                onClick={(e) => onShapeClick(shape.id, e)}
                onDragStart={(e) => onShapeDragStart(shape.id, e)}
                onDragMove={(e) => onShapeDragMove(shape, e)}
                onDragEnd={(e) => onShapeDragEnd(shape, e)}
                stroke={hasStroke ? shape.stroke : darkerBorderColor}
                strokeWidth={hasStroke ? shape.strokeWidth : (isSelected ? 1.5 : 0)}
                shadowBlur={isSelected ? 10 : 0}
                shadowColor={isSelected ? darkerBorderColor : undefined}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'grab';
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                }}
              />
            </Fragment>
          );
        }

        if (shape.type === 'text') {
          const darkerBorderColor = isSelected && shape.fill ? darkenColor(shape.fill, 0.4) : undefined;
          const isEditing = editingTextId === shape.id;
          
          // Build fontStyle string for Konva (combines weight and style)
          const fontWeight = shape.fontWeight || 'normal';
          const fontStyle = shape.fontStyle || 'normal';
          const konvaFontStyle = `${fontStyle} ${fontWeight}`;
          
          // Estimate text width for centering (approximate)
          const fontSize = shape.fontSize || 24;
          const text = shape.text || 'Text';
          const isBold = fontWeight === 'bold';
          const charWidth = isBold ? fontSize * 0.65 : fontSize * 0.6;
          const estimatedWidth = text.length * charWidth;
          
          return (
            <Fragment key={shape.id}>
              {/* Outer glow for other users' selections */}
              {otherUserSelection && (
                <>
                  {/* Glow layer */}
                  <KonvaText
                    x={shape.x}
                    y={shape.y}
                    text={text}
                    fontSize={fontSize}
                    fontFamily={shape.fontFamily || 'Arial'}
                    fontStyle={konvaFontStyle}
                    textDecoration={shape.textDecoration || ''}
                    fill="transparent"
                    stroke={otherUserSelection.color}
                    strokeWidth={6}
                    offsetX={estimatedWidth / 2}
                    offsetY={fontSize / 2}
                    opacity={0.4}
                    listening={false}
                    shadowBlur={25}
                    shadowColor={otherUserSelection.color}
                    shadowOpacity={1}
                  />
                  {/* Solid outline */}
                  <KonvaText
                    x={shape.x}
                    y={shape.y}
                    text={text}
                    fontSize={fontSize}
                    fontFamily={shape.fontFamily || 'Arial'}
                    fontStyle={konvaFontStyle}
                    textDecoration={shape.textDecoration || ''}
                    fill="transparent"
                    stroke={otherUserSelection.color}
                    strokeWidth={2}
                    offsetX={estimatedWidth / 2}
                    offsetY={fontSize / 2}
                    opacity={0.95}
                    listening={false}
                  />
                </>
              )}
              <KonvaText
                id={shape.id}
                x={shape.x}
                y={shape.y}
                text={text}
                fontSize={fontSize}
                fontFamily={shape.fontFamily || 'Arial'}
                fontStyle={konvaFontStyle}
                textDecoration={shape.textDecoration || ''}
                fill={shape.fill}
                offsetX={estimatedWidth / 2}
                offsetY={fontSize / 2}
                draggable={isSelected && !isEditing}
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
                shadowColor={isSelected ? darkerBorderColor : undefined}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = isEditing ? 'text' : 'grab';
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                }}
              />
            </Fragment>
          );
        }

        if (shape.type === 'line') {
          const lineColor = shape.stroke || '#000000';
          const darkerShadowColor = isSelected ? darkenColor(lineColor, 0.3) : undefined;
          
          return (
            <Fragment key={shape.id}>
              {/* Outer glow for other users' selections - VERY VISIBLE */}
              {otherUserSelection && (
                <>
                  {/* Thick glow layer */}
                  <Line
                    x={shape.x}
                    y={shape.y}
                    points={shape.points || [0, 0, 100, 100]}
                    stroke={otherUserSelection.color}
                    strokeWidth={(shape.strokeWidth || 2) + 20}
                    opacity={0.5}
                    listening={false}
                    shadowBlur={35}
                    shadowColor={otherUserSelection.color}
                    shadowOpacity={1}
                  />
                  {/* Solid bright outline */}
                  <Line
                    x={shape.x}
                    y={shape.y}
                    points={shape.points || [0, 0, 100, 100]}
                    stroke={otherUserSelection.color}
                    strokeWidth={(shape.strokeWidth || 2) + 8}
                    opacity={1}
                    listening={false}
                  />
                </>
              )}
              <Line
                id={shape.id}
                x={shape.x}
                y={shape.y}
                points={shape.points || [0, 0, 100, 100]}
                stroke={lineColor}
                strokeWidth={isSelected ? (shape.strokeWidth || 2) + 1 : (shape.strokeWidth || 2)}
                draggable={isSelected}
                onClick={(e) => onShapeClick(shape.id, e)}
                onDragStart={(e) => onShapeDragStart(shape.id, e)}
                onDragMove={(e) => onShapeDragMove(shape, e)}
                onDragEnd={(e) => onShapeDragEnd(shape, e)}
                shadowBlur={isSelected ? 10 : 0}
                shadowColor={isSelected ? darkerShadowColor : undefined}
                hitStrokeWidth={isSelected ? 15 : 10}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'grab';
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                }}
              />
            </Fragment>
          );
        }

        return null;
      })}
      
      {/* Render anchor points for selected lines (hidden while dragging) */}
      {!isDragging && shapes
        .filter(shape => shape.type === 'line' && (shape.id === selectedShapeId || selectedShapeIds.includes(shape.id)))
        .map(shape => (
          <LineAnchors
            key={`anchors-${shape.id}`}
            shape={shape}
            onUpdate={onShapeUpdate}
          />
        ))
      }
      
      {/* Render resize handles for selected rectangles (hidden while dragging) */}
      {!isDragging && shapes
        .filter(shape => shape.type === 'rectangle' && (shape.id === selectedShapeId || selectedShapeIds.includes(shape.id)))
        .map(shape => (
          <ResizeHandles
            key={`handles-${shape.id}`}
            shape={shape}
            onUpdate={onShapeUpdate}
            onResizingChange={onResizingChange}
          />
        ))
      }
      
      {/* Render resize handles for selected arrows (hidden while dragging) */}
      {!isDragging && shapes
        .filter(shape => shape.type === 'arrow' && (shape.id === selectedShapeId || selectedShapeIds.includes(shape.id)))
        .map(shape => (
          <ResizeHandles
            key={`arrow-handles-${shape.id}`}
            shape={shape}
            onUpdate={onShapeUpdate}
            onResizingChange={onResizingChange}
          />
        ))
      }
      
      {/* Render resize handles for selected circles (hidden while dragging) */}
      {!isDragging && shapes
        .filter(shape => shape.type === 'circle' && (shape.id === selectedShapeId || selectedShapeIds.includes(shape.id)))
        .map(shape => (
          <CircleResizeHandles
            key={`circle-handles-${shape.id}`}
            shape={shape}
            onUpdate={onShapeUpdate}
            onResizingChange={onResizingChange}
          />
        ))
      }
    </Layer>
  );
});

