// Canvas constants
export const GRID_SIZE = 20; // Size of each grid cell
export const VIEWPORT_MULTIPLIER = 8; // Grid extends 8x the default viewport

// Memoized cache for color darkening
const darkenColorCache = new Map<string, string>();

// Helper function to darken a color (memoized)
export const darkenColor = (color: string, amount: number = 0.3): string => {
  const cacheKey = `${color}_${amount}`;
  
  // Check cache first
  if (darkenColorCache.has(cacheKey)) {
    return darkenColorCache.get(cacheKey)!;
  }
  
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
  const result = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  
  // Store in cache
  darkenColorCache.set(cacheKey, result);
  
  return result;
};

// Helper function to clamp viewport position to grid boundaries
export const clampViewportPosition = (
  x: number,
  y: number,
  scale: number,
  stageWidth: number,
  stageHeight: number
): { x: number; y: number } => {
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
  const minX = stageWidth - halfWidth * scale;
  
  // To prevent seeing beyond the left edge: -x / scale >= -halfWidth
  // => x <= halfWidth * scale
  const maxX = halfWidth * scale;
  
  // To prevent seeing beyond the bottom edge: (stageHeight - y) / scale <= halfHeight
  // => y >= stageHeight - halfHeight * scale
  const minY = stageHeight - halfHeight * scale;
  
  // To prevent seeing beyond the top edge: -y / scale >= -halfHeight
  // => y <= halfHeight * scale
  const maxY = halfHeight * scale;

  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
};

