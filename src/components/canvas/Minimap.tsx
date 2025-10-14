import React from 'react';
import { ViewportState } from '../../types';
import { VIEWPORT_MULTIPLIER } from '../../utils/canvasHelpers';

interface MinimapProps {
  viewport: ViewportState;
  stageSize: { width: number; height: number };
}

export const Minimap: React.FC<MinimapProps> = ({ viewport, stageSize }) => {
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
          <rect
            x={minimapCenterX - minimapVisibleW / 2}
            y={minimapCenterY - minimapVisibleH / 2}
            width={minimapVisibleW}
            height={minimapVisibleH}
            fill="rgba(79, 70, 229, 0.2)"
            stroke="#4F46E5"
            strokeWidth="1"
          />
        </svg>
        
        {/* Zoom level indicator */}
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          {Math.round(viewport.scale * 100)}%
        </div>
      </div>
    </div>
  );
};

