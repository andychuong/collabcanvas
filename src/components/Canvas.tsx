import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text as KonvaText, Group, Line } from 'react-konva';
import Konva from 'konva';
import { Shape, Cursor as CursorType, ViewportState } from '../types';

interface CanvasProps {
  shapes: Shape[];
  cursors: CursorType[];
  onShapeUpdate: (shape: Shape) => void;
  onShapeSelect: (shapeId: string | null) => void;
  onMultiSelect?: (shapeIds: string[]) => void;
  selectedShapeId: string | null;
  selectedShapeIds?: string[];
  onCursorMove: (x: number, y: number) => void;
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
  onViewportInteraction?: (isInteracting: boolean) => void;
  showMinimap?: boolean;
}

const GRID_SIZE = 20; // Size of each grid cell
const VIEWPORT_MULTIPLIER = 8; // Grid extends 8x the default viewport

// Helper function to darken a color
const darkenColor = (color: string, amount: number = 0.3): string => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Darken by reducing each channel
  const newR = Math.max(0, Math.floor(r * (1 - amount)));
  const newG = Math.max(0, Math.floor(g * (1 - amount)));
  const newB = Math.max(0, Math.floor(b * (1 - amount)));
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export const Canvas: React.FC<CanvasProps> = ({
  shapes,
  cursors,
  onShapeUpdate,
  onShapeSelect,
  onMultiSelect,
  selectedShapeId,
  selectedShapeIds = [],
  onCursorMove,
  viewport,
  onViewportChange,
  onViewportInteraction,
  showMinimap = false,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight - 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textareaValue, setTextareaValue] = useState('');
  const [textareaPosition, setTextareaPosition] = useState({ x: 0, y: 0 });
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle window resize - constrain to viewport container
  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(window.innerWidth - 360, 1600);
      const height = Math.min(window.innerHeight - 140, 900);
      setStageSize({
        width: Math.max(width, 400),
        height: Math.max(height, 300),
      });
    };

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (pos) {
      // Convert screen coordinates to canvas coordinates
      const scale = viewport.scale;
      const x = (pos.x - viewport.x) / scale;
      const y = (pos.y - viewport.y) / scale;
      onCursorMove(x, y);
    }
  }, [viewport, onCursorMove]);

  // Helper function to clamp viewport position to grid boundaries
  const clampViewportPosition = useCallback((x: number, y: number, scale: number) => {
    const workspaceWidth = 1600 * VIEWPORT_MULTIPLIER;
    const workspaceHeight = 900 * VIEWPORT_MULTIPLIER;
    const halfWidth = workspaceWidth / 2;
    const halfHeight = workspaceHeight / 2;

    // Calculate boundaries
    // The viewport position (x,y) is the stage offset
    // Visible world coordinates are: [-x/scale, (stageWidth-x)/scale] x [-y/scale, (stageHeight-y)/scale]
    // We want to keep this within [-halfWidth, halfWidth] x [-halfHeight, halfHeight]
    
    // To prevent seeing beyond the right edge: (stageWidth - x) / scale <= halfWidth
    // => x >= stageWidth - halfWidth * scale
    const minX = stageSize.width - halfWidth * scale;
    
    // To prevent seeing beyond the left edge: -x / scale >= -halfWidth
    // => x <= halfWidth * scale
    const maxX = halfWidth * scale;
    
    // To prevent seeing beyond the bottom edge: (stageHeight - y) / scale <= halfHeight
    // => y >= stageHeight - halfHeight * scale
    const minY = stageSize.height - halfHeight * scale;
    
    // To prevent seeing beyond the top edge: -y / scale >= -halfHeight
    // => y <= halfHeight * scale
    const maxY = halfHeight * scale;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, [stageSize]);

  // Handle viewport interaction visibility
  const notifyInteraction = useCallback(() => {
    if (onViewportInteraction) {
      onViewportInteraction(true);
      
      // Clear existing timer
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
      
      // Hide minimap after 2 seconds of no interaction
      interactionTimerRef.current = setTimeout(() => {
        onViewportInteraction(false);
      }, 2000);
    }
  }, [onViewportInteraction]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    onCursorMove(-1000, -1000); // Move cursor off screen
  }, [onCursorMove]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    notifyInteraction(); // Show minimap

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Calculate minimum scale to fit entire grid in viewport
    const workspaceWidth = 1600 * VIEWPORT_MULTIPLIER;
    const workspaceHeight = 900 * VIEWPORT_MULTIPLIER;
    const minScaleX = stageSize.width / workspaceWidth;
    const minScaleY = stageSize.height / workspaceHeight;
    const minScale = Math.min(minScaleX, minScaleY);

    // Clamp scale between minScale (to keep grid visible) and 5 (max zoom in)
    const clampedScale = Math.max(minScale, Math.min(5, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // Clamp position to grid boundaries
    const clampedPos = clampViewportPosition(newPos.x, newPos.y, clampedScale);

    onViewportChange({
      x: clampedPos.x,
      y: clampedPos.y,
      scale: clampedScale,
    });
  }, [viewport, onViewportChange, stageSize, clampViewportPosition, notifyInteraction]);

  // Handle stage drag (panning)
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Only update viewport if we're dragging the stage itself, not a shape
    if (e.target === stageRef.current) {
      // Clamp position to grid boundaries
      const clampedPos = clampViewportPosition(e.target.x(), e.target.y(), viewport.scale);
      
      // Update both the stage position and viewport state
      e.target.x(clampedPos.x);
      e.target.y(clampedPos.y);
      
      onViewportChange({
        x: clampedPos.x,
        y: clampedPos.y,
        scale: viewport.scale,
      });
    }
    setIsDragging(false);
  }, [viewport.scale, onViewportChange, clampViewportPosition]);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Only set isDragging if we're dragging the stage itself
    if (e.target === stageRef.current) {
      setIsDragging(true);
      notifyInteraction(); // Show minimap
    }
  }, [notifyInteraction]);

  // Handle shape selection
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicked on empty area, deselect
    if (e.target === stageRef.current || e.target.parent?.attrs.name === 'background-layer') {
      onShapeSelect(null);
      if (onMultiSelect) {
        onMultiSelect([]);
      }
    }
  }, [onShapeSelect, onMultiSelect]);

  const handleShapeClick = useCallback((shapeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDragging) return;

    const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
    
    if (isMultiSelect && onMultiSelect) {
      // Multi-select mode
      const currentSelection = selectedShapeIds || [];
      if (currentSelection.includes(shapeId)) {
        // Deselect if already selected
        onMultiSelect(currentSelection.filter(id => id !== shapeId));
      } else {
        // Add to selection
        onMultiSelect([...currentSelection, shapeId]);
      }
    } else {
      // Single select
      onShapeSelect(shapeId);
      if (onMultiSelect) {
        onMultiSelect([shapeId]);
      }
    }
  }, [isDragging, onShapeSelect, onMultiSelect, selectedShapeIds]);

  // Handle shape drag
  const handleShapeDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage from being dragged when dragging a shape
    e.cancelBubble = true;
  }, []);

  const handleShapeDragEnd = useCallback((shape: Shape, e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent stage drag event
    e.cancelBubble = true;
    
    const node = e.target;
    onShapeUpdate({
      ...shape,
      x: node.x(),
      y: node.y(),
      updatedAt: Date.now(),
    });
  }, [onShapeUpdate]);

  // Handle text double-click for editing
  const handleTextDblClick = useCallback((shape: Shape, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;

    // Get the text node to find its absolute position on screen
    const textNode = e.target as Konva.Text;
    const absolutePosition = textNode.getAbsolutePosition();
    
    // Get the stage container position
    const stageBox = stage.container().getBoundingClientRect();
    
    // Calculate the absolute screen position of the text
    // absolutePosition already accounts for all transformations (scale, position)
    const screenX = stageBox.left + absolutePosition.x;
    const screenY = stageBox.top + absolutePosition.y;
    
    setEditingTextId(shape.id);
    setTextareaValue(shape.text || '');
    setTextareaPosition({ x: screenX, y: screenY });
  }, []);

  // Handle text edit complete
  const handleTextEditComplete = useCallback(() => {
    if (!editingTextId) return;

    const shape = shapes.find(s => s.id === editingTextId);
    if (shape && shape.type === 'text') {
      onShapeUpdate({
        ...shape,
        text: textareaValue,
        updatedAt: Date.now(),
      });
    }

    setEditingTextId(null);
    setTextareaValue('');
  }, [editingTextId, textareaValue, shapes, onShapeUpdate]);

  return (
    <div className="mt-[60px] ml-[280px] flex items-start justify-start pl-4 pt-8 h-[calc(100vh-60px)]">
      <div className="relative border-4 border-gray-300 rounded-lg shadow-2xl overflow-hidden bg-white" style={{
        width: 'calc(100vw - 360px)',
        height: 'calc(100vh - 140px)',
        maxWidth: '1600px',
        maxHeight: '900px',
      }}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={true}
          dragBoundFunc={(pos) => {
            // Constrain drag to grid boundaries in real-time
            const clamped = clampViewportPosition(pos.x, pos.y, viewport.scale);
            return clamped;
          }}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
        {/* Background layer with grid */}
        <Layer name="background-layer">
          {(() => {
            // Calculate workspace size as 8x the default viewport (1600x900)
            const workspaceWidth = 1600 * VIEWPORT_MULTIPLIER;
            const workspaceHeight = 900 * VIEWPORT_MULTIPLIER;
            const halfWidth = workspaceWidth / 2;
            const halfHeight = workspaceHeight / 2;
            
            return (
              <>
                {/* Base background */}
                <Rect
                  x={-halfWidth}
                  y={-halfHeight}
                  width={workspaceWidth}
                  height={workspaceHeight}
                  fill="#ffffff"
                  listening={false}
                />
                
                {/* Grid lines */}
                {(() => {
                  const lines = [];
                  
                  // Vertical lines
                  for (let i = -halfWidth; i <= halfWidth; i += GRID_SIZE) {
                    lines.push(
                      <Line
                        key={`v-${i}`}
                        points={[i, -halfHeight, i, halfHeight]}
                        stroke="#e0e0e0"
                        strokeWidth={i % (GRID_SIZE * 5) === 0 ? 1.5 : 0.5}
                        listening={false}
                      />
                    );
                  }
                  
                  // Horizontal lines
                  for (let i = -halfHeight; i <= halfHeight; i += GRID_SIZE) {
                    lines.push(
                      <Line
                        key={`h-${i}`}
                        points={[-halfWidth, i, halfWidth, i]}
                        stroke="#e0e0e0"
                        strokeWidth={i % (GRID_SIZE * 5) === 0 ? 1.5 : 0.5}
                        listening={false}
                      />
                    );
                  }
                  
                  return lines;
                })()}
              </>
            );
          })()}
        </Layer>

        {/* Shapes layer */}
        <Layer>
          {shapes.map((shape) => {
            const isSelected = shape.id === selectedShapeId || selectedShapeIds.includes(shape.id);

            if (shape.type === 'rectangle') {
              const darkerBorderColor = isSelected && shape.fill ? darkenColor(shape.fill, 0.4) : undefined;
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width || 100}
                  height={shape.height || 100}
                  fill={shape.fill}
                  rotation={shape.rotation || 0}
                  draggable={true}
                  onClick={(e) => handleShapeClick(shape.id, e)}
                  onDragStart={handleShapeDragStart}
                  onDragEnd={(e) => handleShapeDragEnd(shape, e)}
                  stroke={darkerBorderColor}
                  strokeWidth={isSelected ? 3 : 0}
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
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius || 50}
                  fill={shape.fill}
                  draggable={true}
                  onClick={(e) => handleShapeClick(shape.id, e)}
                  onDragStart={handleShapeDragStart}
                  onDragEnd={(e) => handleShapeDragEnd(shape, e)}
                  stroke={darkerBorderColor}
                  strokeWidth={isSelected ? 3 : 0}
                  shadowBlur={isSelected ? 10 : 0}
                  shadowColor={darkerBorderColor}
                />
              );
            }

            if (shape.type === 'text') {
              const darkerBorderColor = isSelected && shape.fill ? darkenColor(shape.fill, 0.4) : undefined;
              return (
                <KonvaText
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text || 'Text'}
                  fontSize={shape.fontSize || 24}
                  fill={shape.fill}
                  draggable={true}
                  visible={editingTextId !== shape.id}
                  onClick={(e) => handleShapeClick(shape.id, e)}
                  onDblClick={(e) => handleTextDblClick(shape, e)}
                  onDragStart={handleShapeDragStart}
                  onDragEnd={(e) => handleShapeDragEnd(shape, e)}
                  stroke={darkerBorderColor}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
              );
            }

            if (shape.type === 'line') {
              const lineColor = shape.stroke || '#000000';
              const darkerShadowColor = isSelected ? darkenColor(lineColor, 0.3) : undefined;
              return (
                <Line
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  points={shape.points || [0, 0, 100, 100]}
                  stroke={lineColor}
                  strokeWidth={isSelected ? (shape.strokeWidth || 2) + 1 : (shape.strokeWidth || 2)}
                  draggable={true}
                  onClick={(e) => handleShapeClick(shape.id, e)}
                  onDragStart={handleShapeDragStart}
                  onDragEnd={(e) => handleShapeDragEnd(shape, e)}
                  shadowBlur={isSelected ? 10 : 0}
                  shadowColor={darkerShadowColor}
                  hitStrokeWidth={isSelected ? 15 : 10}
                />
              );
            }

            return null;
          })}
        </Layer>

        {/* Cursors layer */}
        <Layer listening={false}>
          {cursors.map((cursor) => (
            <Group key={cursor.userId} x={cursor.x} y={cursor.y}>
              {/* Cursor pointer */}
              <Circle
                radius={5}
                fill={cursor.color}
                shadowBlur={5}
                shadowColor={cursor.color}
              />
              {/* User name label */}
              <KonvaText
                x={10}
                y={-5}
                text={cursor.userName}
                fontSize={12}
                fill="#ffffff"
                padding={4}
                cornerRadius={4}
                shadowBlur={2}
                shadowColor="rgba(0,0,0,0.3)"
              />
              <Rect
                x={10}
                y={-5}
                width={cursor.userName.length * 7 + 8}
                height={20}
                fill={cursor.color}
                cornerRadius={4}
                shadowBlur={2}
                shadowColor="rgba(0,0,0,0.3)"
              />
              <KonvaText
                x={14}
                y={-1}
                text={cursor.userName}
                fontSize={12}
                fill="#ffffff"
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* Minimap - shown during pan/zoom, positioned at bottom-right of canvas */}
      {showMinimap && (
        <div 
          className="absolute bottom-4 right-4 z-50 bg-white/95 backdrop-blur-sm border-2 border-gray-400 rounded-lg shadow-2xl p-3 w-56 animate-fadeIn"
        >
          <div className="relative w-full aspect-[16/9] bg-gray-50 border border-gray-200 rounded overflow-hidden">
            {/* Grid representation */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet">
              {/* Grid background */}
              <rect x="0" y="0" width="160" height="90" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
              
              {/* Grid pattern */}
              <defs>
                <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.3"/>
                </pattern>
              </defs>
              <rect x="0" y="0" width="160" height="90" fill="url(#grid-pattern)" />
              
              {/* Viewport rectangle */}
              {(() => {
                const gridWidth = 1600 * VIEWPORT_MULTIPLIER;
                const gridHeight = 900 * VIEWPORT_MULTIPLIER;
                
                // Scale viewport position to minimap coordinates
                const minimapWidth = 160;
                const minimapHeight = 90;
                
                // Calculate visible area in world coordinates
                const visibleWidth = stageSize.width / viewport.scale;
                const visibleHeight = stageSize.height / viewport.scale;
                
                // World space is centered at (0,0), ranging from [-gridWidth/2, gridWidth/2]
                // Calculate top-left corner of visible area in world space
                const worldLeft = -viewport.x / viewport.scale;
                const worldTop = -viewport.y / viewport.scale;
                const worldCenterX = worldLeft + visibleWidth / 2;
                const worldCenterY = worldTop + visibleHeight / 2;
                
                // Normalize to [0, 1] range (0 = left/top edge, 1 = right/bottom edge)
                const normalizedX = (worldCenterX + gridWidth / 2) / gridWidth;
                const normalizedY = (worldCenterY + gridHeight / 2) / gridHeight;
                
                // Convert to minimap pixel coordinates
                const minimapCenterX = normalizedX * minimapWidth;
                const minimapCenterY = normalizedY * minimapHeight;
                const minimapVisibleW = (visibleWidth / gridWidth) * minimapWidth;
                const minimapVisibleH = (visibleHeight / gridHeight) * minimapHeight;
                
                return (
                  <rect
                    x={minimapCenterX - minimapVisibleW / 2}
                    y={minimapCenterY - minimapVisibleH / 2}
                    width={minimapVisibleW}
                    height={minimapVisibleH}
                    fill="rgba(79, 70, 229, 0.2)"
                    stroke="#4F46E5"
                    strokeWidth="1"
                  />
                );
              })()}
            </svg>
            
            {/* Zoom level indicator */}
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
              {Math.round(viewport.scale * 100)}%
            </div>
          </div>
        </div>
      )}

      </div>
      
      {/* Text editing textarea - positioned relative to viewport */}
      {editingTextId && (
        <textarea
          value={textareaValue}
          onChange={(e) => setTextareaValue(e.target.value)}
          onBlur={handleTextEditComplete}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
              e.preventDefault();
              handleTextEditComplete();
            }
          }}
          autoFocus
          style={{
            position: 'fixed',
            top: `${textareaPosition.y}px`,
            left: `${textareaPosition.x}px`,
            fontSize: `${(shapes.find(s => s.id === editingTextId)?.fontSize || 24) * viewport.scale}px`,
            border: 'none',
            outline: '1px solid #9CA3AF',
            padding: '2px',
            background: 'transparent',
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2',
            color: shapes.find(s => s.id === editingTextId)?.fill || '#000000',
            caretColor: '#000000',
            zIndex: 1000,
            minWidth: '100px',
          }}
        />
      )}
    </div>
  );
};

