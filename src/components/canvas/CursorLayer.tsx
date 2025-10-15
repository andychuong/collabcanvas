import React from 'react';
import { Layer, Group, Circle, Text as KonvaText, Rect } from 'react-konva';
import { Cursor as CursorType } from '../../types';

interface CursorLayerProps {
  cursors: CursorType[];
}

export const CursorLayer: React.FC<CursorLayerProps> = React.memo(({ cursors }) => {
  return (
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
          {/* User name label background */}
          <Rect
            x={10}
            y={-5}
            width={cursor.userName.length * 7.5 + 12}
            height={20}
            fill={cursor.color}
            cornerRadius={4}
            shadowBlur={2}
            shadowColor="rgba(0,0,0,0.3)"
          />
          {/* User name text */}
          <KonvaText
            x={16}
            y={-1}
            text={cursor.userName}
            fontSize={12}
            fill="#ffffff"
          />
        </Group>
      ))}
    </Layer>
  );
});

