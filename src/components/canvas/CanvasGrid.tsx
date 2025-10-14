import React from 'react';
import { Layer, Rect, Line } from 'react-konva';
import { GRID_SIZE, VIEWPORT_MULTIPLIER } from '../../utils/canvasHelpers';

export const CanvasGrid: React.FC = () => {
  // Calculate workspace size as 8x the default viewport (1600x900)
  const workspaceWidth = 1600 * VIEWPORT_MULTIPLIER;
  const workspaceHeight = 900 * VIEWPORT_MULTIPLIER;
  const halfWidth = workspaceWidth / 2;
  const halfHeight = workspaceHeight / 2;
  
  // Generate grid lines
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

  return (
    <Layer name="background-layer">
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
      {lines}
    </Layer>
  );
};

