import React from 'react';
import { Layer, Group, Circle, Text as KonvaText, Rect } from 'react-konva';
import { Cursor as CursorType } from '../../types';

interface CursorLayerProps {
  cursors: CursorType[];
}

export const CursorLayer: React.FC<CursorLayerProps> = ({ cursors }) => {
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
  );
};

