# Performance Optimization Guide

## Quick Wins (Already Implemented)

✅ Throttled cursor updates (75ms)
✅ Throttled shape updates (16ms)
✅ Batch operations for multiple shapes
✅ Optimistic UI updates

## Additional Optimizations to Implement

### 1. Enable Hardware Acceleration (CSS)

Add to `src/index.css`:

```css
/* Force GPU acceleration for canvas */
canvas {
  will-change: transform;
  transform: translateZ(0);
}

/* Smooth cursor movements */
.cursor-layer {
  will-change: transform;
}
```

### 2. Optimize Konva Layers

In `src/components/Canvas.tsx`:

```typescript
// Static grid layer - cache it!
<Layer
  listening={false}
  perfectDrawEnabled={false}
>
  <CanvasGrid />
</Layer>

// Shapes layer - batch draws
<Layer
  ref={shapesLayerRef}
  perfectDrawEnabled={false}
>
  {shapes.map(shape => (
    <ShapeRenderer
      key={shape.id}
      shape={shape}
      perfectDrawEnabled={false}
    />
  ))}
</Layer>

// Cursors layer - separate for smooth updates
<Layer
  listening={false}
  perfectDrawEnabled={false}
>
  <CursorLayer cursors={cursors} />
</Layer>
```

### 3. Batch Draw Operations

```typescript
// In useShapes.ts or Canvas.tsx
const batchDraw = useCallback(() => {
  const stage = stageRef.current;
  if (!stage) return;
  
  // Only redraw once for multiple shape updates
  requestAnimationFrame(() => {
    stage.batchDraw();
  });
}, []);
```

### 4. Virtualization for Many Shapes

If you have 100+ shapes:

```typescript
// Only render shapes in viewport
const visibleShapes = useMemo(() => {
  const padding = 100;
  return shapes.filter(shape => {
    return (
      shape.x + (shape.width || 0) > viewport.x - stageSize.width/2 - padding &&
      shape.x < viewport.x + stageSize.width/2 + padding &&
      shape.y + (shape.height || 0) > viewport.y - stageSize.height/2 - padding &&
      shape.y < viewport.y + stageSize.height/2 + padding
    );
  });
}, [shapes, viewport, stageSize]);
```

### 5. Debounce Expensive Operations

```typescript
// For AI chat or complex calculations
const debouncedAnalysis = useMemo(
  () => debounce((shapes: Shape[]) => {
    // Expensive operation
  }, 500),
  []
);
```

## Performance Monitoring

### Add FPS Counter

```typescript
// In Canvas.tsx
const [fps, setFps] = useState(0);

useEffect(() => {
  let frameCount = 0;
  let lastTime = performance.now();
  
  const measureFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      setFps(frameCount);
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  };
  
  measureFPS();
}, []);

// Display in toolbar or dev mode
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-2 right-2 bg-black text-white px-2 py-1 rounded">
    {fps} FPS
  </div>
)}
```

## Browser-Specific Optimizations

### Chrome DevTools

1. Open DevTools → Performance
2. Record while dragging shapes
3. Look for "Long Tasks" (>50ms)
4. Check "Rendering" tab → Enable "Paint flashing"

### Firefox DevTools

1. Open DevTools → Performance
2. Enable "Enable paint flashing" in settings
3. Check for unnecessary repaints

## Mobile Optimizations

For touch devices:

```typescript
// In Canvas.tsx
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

<Stage
  width={stageSize.width}
  height={stageSize.height}
  scale={{ x: viewport.scale, y: viewport.scale }}
  position={{ x: viewport.x, y: viewport.y }}
  draggable={!isMobile} // Disable for better touch handling
  onWheel={handleWheel}
  pixelRatio={isMobile ? 1 : 2} // Lower resolution on mobile
>
```

## Expected Performance

| Scenario | Target FPS | Notes |
|----------|-----------|-------|
| Idle | 60 | Minimal redraws |
| Dragging 1 shape | 60 | Smooth with throttling |
| Dragging 10 shapes | 50-60 | Good performance |
| 100+ shapes | 30-60 | Use virtualization |
| Real-time cursors | 60 | Already throttled |

## Advanced: WebGL Renderer

For 500+ shapes, consider switching to WebGL:

```bash
npm install konva-gl
```

```typescript
import { Stage, Layer } from 'konva-gl';
// Rest of code stays the same
```

**Trade-offs:**
- ✅ 2-10x faster rendering
- ❌ Slightly different rendering (anti-aliasing)
- ❌ Additional dependency

## Profiling Checklist

- [ ] Enable paint flashing in Chrome
- [ ] Record performance timeline
- [ ] Check for >50ms tasks
- [ ] Verify 60 FPS during idle
- [ ] Test with 100+ shapes
- [ ] Test on slower devices
- [ ] Monitor Firebase bandwidth

## Current Bottlenecks

Based on your app (49 shapes, 4 users):

1. **Firestore writes** - Already optimized with throttling ✅
2. **Cursor updates** - Already throttled to 75ms ✅
3. **Real-time listeners** - Efficient ✅
4. **Canvas rendering** - Can be improved with above tips 🟡

## Recommendation

**For your current scale (49 shapes, 4 users):**

Priority 1 (Do Now):
- Add `perfectDrawEnabled={false}` to layers
- Add `will-change: transform` to CSS
- Separate static/dynamic layers

Priority 2 (If Needed):
- Add virtualization if going >100 shapes
- Profile with Chrome DevTools
- Consider WebGL if going >500 shapes

Priority 3 (Future):
- Batch draw operations
- Add FPS monitoring in dev mode
- Mobile-specific optimizations

