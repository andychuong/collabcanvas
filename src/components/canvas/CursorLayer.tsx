import React from 'react';
import { Layer, Group, Line, Text as KonvaText, Rect } from 'react-konva';
import { Cursor as CursorType } from '../../types';

interface CursorLayerProps {
  cursors: CursorType[];
}

export const CursorLayer: React.FC<CursorLayerProps> = React.memo(({ cursors }) => {
  return (
    <Layer listening={false}>
      {cursors.map((cursor) => {
        // More accurate text width calculation (bold font is wider)
        const textWidth = cursor.userName.length * 8.5;
        const horizontalPadding = 8;
        const nameTagWidth = textWidth + (horizontalPadding * 2);
        const nameTagX = 20; // More space from arrow
        
        return (
          <Group key={cursor.userId} x={cursor.x} y={cursor.y}>
            {/* Cursor arrow pointer - simple triangle design */}
            <Line
              points={[
                0, 0,           // Tip (top)
                0, 16,          // Bottom left
                11, 11,         // Right point
                0, 0            // Back to tip
              ]}
              closed={true}
              fill={cursor.color}
              stroke={cursor.color}
              strokeWidth={2}
              shadowBlur={3}
              shadowColor="rgba(0,0,0,0.3)"
              shadowOffsetX={1}
              shadowOffsetY={1}
            />
            {/* User name label background */}
            <Rect
              x={nameTagX}
              y={2}
              width={nameTagWidth}
              height={20}
              fill={cursor.color}
              cornerRadius={4}
              shadowBlur={2}
              shadowColor="rgba(0,0,0,0.3)"
            />
            {/* User name text - centered using align */}
            <KonvaText
              x={nameTagX}
              y={6}
              width={nameTagWidth}
              text={cursor.userName}
              fontSize={12}
              fill="#ffffff"
              fontStyle="bold"
              align="center"
            />
          </Group>
        );
      })}
    </Layer>
  );
});

