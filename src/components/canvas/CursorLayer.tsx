import React, { useState, useEffect, useRef } from 'react';
import { Layer, Group, Line, Text as KonvaText, Rect } from 'react-konva';
import { Cursor as CursorType } from '../../types';

interface CursorLayerProps {
  cursors: CursorType[];
}

interface InterpolatedCursor extends CursorType {
  targetX: number;
  targetY: number;
}

export const CursorLayer: React.FC<CursorLayerProps> = React.memo(({ cursors }) => {
  const [interpolatedCursors, setInterpolatedCursors] = useState<InterpolatedCursor[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize and update interpolated cursors when real cursors change
  useEffect(() => {
    setInterpolatedCursors((prev) => {
      const newCursors: InterpolatedCursor[] = [];
      
      cursors.forEach((cursor) => {
        const existing = prev.find(c => c.userId === cursor.userId);
        
        if (existing) {
          // Update target position for existing cursor
          newCursors.push({
            ...existing,
            targetX: cursor.x,
            targetY: cursor.y,
            userName: cursor.userName,
            color: cursor.color,
            timestamp: cursor.timestamp,
          });
        } else {
          // New cursor - start at target position
          newCursors.push({
            ...cursor,
            targetX: cursor.x,
            targetY: cursor.y,
          });
        }
      });
      
      return newCursors;
    });
  }, [cursors]);

  // Smooth interpolation animation loop - continuous
  useEffect(() => {
    let isRunning = true;
    
    const animate = () => {
      if (!isRunning) return;
      
      setInterpolatedCursors((prev) => {
        const updated = prev.map((cursor) => {
          const dx = cursor.targetX - cursor.x;
          const dy = cursor.targetY - cursor.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If we're close enough, snap to target
          if (distance < 0.5) {
            if (cursor.x === cursor.targetX && cursor.y === cursor.targetY) {
              return cursor;
            }
            return { ...cursor, x: cursor.targetX, y: cursor.targetY };
          }
          
          // Smooth interpolation with easing (lerp with factor of 0.3 for responsive smoothness)
          const lerpFactor = 0.3;
          const newX = cursor.x + dx * lerpFactor;
          const newY = cursor.y + dy * lerpFactor;
          
          return { ...cursor, x: newX, y: newY };
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
  }, []); // Only run once on mount

  return (
    <Layer listening={false}>
      {interpolatedCursors.map((cursor) => {
        // Larger text width calculation for bigger name tags
        const textWidth = cursor.userName.length * 10;
        const horizontalPadding = 12;
        const nameTagWidth = textWidth + (horizontalPadding * 2);
        const nameTagX = 26; // More space from larger arrow
        
        return (
          <Group key={cursor.userId} x={cursor.x} y={cursor.y}>
            {/* Cursor arrow pointer - larger triangle design */}
            <Line
              points={[
                0, 0,           // Tip (top)
                0, 22,          // Bottom left (larger)
                15, 15,         // Right point (larger)
                0, 0            // Back to tip
              ]}
              closed={true}
              fill={cursor.color}
              stroke="#000000"
              strokeWidth={2.5}
              shadowBlur={4}
              shadowColor="rgba(0,0,0,0.4)"
              shadowOffsetX={1}
              shadowOffsetY={1}
            />
            {/* User name label background - larger */}
            <Rect
              x={nameTagX}
              y={3}
              width={nameTagWidth}
              height={26}
              fill={cursor.color}
              cornerRadius={5}
              shadowBlur={3}
              shadowColor="rgba(0,0,0,0.4)"
            />
            {/* User name text - larger font */}
            <KonvaText
              x={nameTagX}
              y={8}
              width={nameTagWidth}
              text={cursor.userName}
              fontSize={14}
              fill="#000000"
              fontStyle="bold"
              align="center"
            />
          </Group>
        );
      })}
    </Layer>
  );
});

