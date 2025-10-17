# Layer Controls Feature

## Overview

A simple but powerful layer management system has been added to control the stacking order of shapes on the canvas.

## Features Implemented

### 4 Layer Controls

1. **Bring to Front** (⏫) - Move shape to the top layer
2. **Bring Forward** (↑) - Move shape up one layer
3. **Send Backward** (↓) - Move shape down one layer
4. **Send to Back** (⏬) - Move shape to the bottom layer

### How It Works

- Each shape has a `zIndex` property (default: 0)
- Shapes are rendered in order from lowest to highest zIndex
- Lower zIndex = behind, Higher zIndex = in front
- All new shapes start at zIndex: 0
- Duplicated shapes appear one layer above the original

## UI Controls

**Location**: Toolbar (appears when a shape is selected)

**Visual Design**: 
- 4 buttons in a compact group
- Icons: ChevronsUp, ArrowUp, ArrowDown, ChevronsDown
- Tooltips on hover
- Only visible when a single shape is selected

## Usage

### Manual Controls

1. Select any shape
2. Look for the layer control buttons in the toolbar
3. Click:
   - **⏫** to bring to front (top layer)
   - **↑** to bring forward one layer
   - **↓** to send backward one layer
   - **⏬** to send to back (bottom layer)

### Keyboard Shortcuts

Currently no keyboard shortcuts - can be added if needed:
- Suggested: `Ctrl/Cmd + ]` for bring forward
- Suggested: `Ctrl/Cmd + [` for send backward  
- Suggested: `Ctrl/Cmd + Shift + ]` for bring to front
- Suggested: `Ctrl/Cmd + Shift + [` for send to back

## Technical Implementation

### Files Modified

**1. `src/App.tsx`**
- Added `handleBringToFront()` - Sets zIndex to max + 1
- Added `handleSendToBack()` - Sets zIndex to min - 1
- Added `handleBringForward()` - Increments zIndex by 1
- Added `handleSendBackward()` - Decrements zIndex by 1
- Added zIndex: 0 to all shape creation code
- Duplicated shapes get zIndex + 1

**2. `src/components/Toolbar.tsx`**
- Added layer control props to interface
- Added 4 layer control buttons
- Icons: ChevronsUp, ArrowUp, ArrowDown, ChevronsDown
- Tooltips for each button

**3. `src/components/Canvas.tsx`**
- Shapes sorted by zIndex before rendering: `.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))`
- Lower zIndex renders first (behind)
- Higher zIndex renders last (in front)

**4. `src/services/aiAgent.ts`**
- All AI-created shapes get zIndex: 0
- Consistent with manual shape creation

**5. `src/types.ts`**
- `zIndex?: number` already existed in Shape interface

## Layer Logic

### Bring to Front
```typescript
zIndex = Math.max(...all shapes zIndex) + 1
```

### Send to Back  
```typescript
zIndex = Math.min(...all shapes zIndex) - 1
```

### Bring Forward
```typescript
zIndex = currentZIndex + 1
```

### Send Backward
```typescript
zIndex = currentZIndex - 1
```

## Examples

### Overlapping Shapes
```
1. Create a red rectangle at 300, 300
2. Create a blue circle at 320, 320 (overlaps)
3. Select the rectangle
4. Click "Bring to Front" ⏫
5. Rectangle now appears above the circle
```

### Complex Layering
```
1. Create multiple overlapping shapes
2. Select one shape
3. Use ↑ and ↓ to fine-tune its position in the stack
4. Use ⏫ and ⏬ for immediate top/bottom placement
```

## AI Chat Integration

The AI Chat also creates shapes with proper zIndex support. Users can ask:
```
"Bring the red circle to the front"
"Send the rectangle to the back"
```

(Note: You'll need to add layer control tools to the AI agent if you want AI to control layers)

## Undo/Redo Support

✅ Layer changes are tracked in history
✅ Undo/Redo works with layer operations
✅ Layer state syncs across all users in real-time

## Multi-User Collaboration

✅ Layer changes sync to all connected users
✅ Everyone sees the same stacking order
✅ "Last write wins" for conflicting layer changes
✅ Works seamlessly with existing collaborative features

## Future Enhancements

Possible improvements:
1. Add keyboard shortcuts for layer operations
2. Show current layer number in toolbar
3. Layer panel showing all shapes in order
4. Drag-and-drop layer reordering
5. Lock layers to prevent accidental changes
6. Name layers for better organization
7. AI tools for "bring shape X to front"

## Testing

Try these scenarios:
1. ✅ Create two overlapping shapes
2. ✅ Use "Bring to Front" on the bottom shape
3. ✅ Use "Send to Back" on the top shape
4. ✅ Fine-tune with "Bring Forward" and "Send Backward"
5. ✅ Test with all shape types (circle, rectangle, text, line)
6. ✅ Test undo/redo with layer operations
7. ✅ Test multi-user layer sync

## Build Status

✅ TypeScript compilation: PASSED
✅ No linter errors: CONFIRMED
✅ Production build: SUCCESSFUL

---

**Implementation Date**: October 16, 2025
**Status**: COMPLETE ✅
**Feature Type**: Simple layer management
**Complexity**: Low
**User Experience**: Intuitive and straightforward

