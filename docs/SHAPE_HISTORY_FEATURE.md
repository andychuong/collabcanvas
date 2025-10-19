# Shape History Feature

## Overview

The Shape History feature allows users to track all changes made to shapes on the collaborative canvas, including who made the changes and when. Users can view the complete history of a shape and restore previous versions with a single click.

## Features

### 1. **Automatic History Tracking**
- Every shape creation, transformation, and style change is automatically tracked
- History entries include:
  - Complete snapshot of the shape state
  - Timestamp of the change
  - User who made the change
  - Type of change (created, transformed, or styled)

### 2. **History Types**
- **Created**: When a shape is first added to the canvas
- **Transformed**: When position, size, rotation, or dimensions change
- **Styled**: When colors, stroke width, or other style properties change

### 3. **History Panel UI**
- Accessible via the History button (clock icon) in the toolbar when a shape is selected
- Shows up to 50 recent versions of the selected shape
- Displays for each version:
  - Action type with visual icon
  - Timestamp (relative or absolute)
  - User who made the change
  - Change details (position, size, colors, etc.)
  - Restore button (except for current version)

### 4. **Version Restoration**
- Click "Restore this version" on any historical entry
- Shape immediately reverts to that version
- Restoration creates a new history entry

## How to Use

### Viewing History
1. Select a single shape on the canvas
2. Click the **History** button (clock icon) in the toolbar
3. The History Panel will appear on the right side of the screen
4. Scroll through the timeline to see all changes

### Restoring a Version
1. Open the History Panel for a shape
2. Browse through the historical versions
3. Click "Restore this version" on the version you want to restore
4. The shape will be updated immediately

### Closing History
- Click the X button in the History Panel header
- Click the History button again in the toolbar
- Select a different shape

## Technical Details

### Data Storage
- History entries are stored in Firestore under:
  ```
  /groups/{groupId}/canvases/{canvasId}/history/{entryId}
  ```
- Each entry contains a complete snapshot of the shape at that moment
- History is limited to 50 entries per shape (configurable)

### Security
- History is protected by the same Firestore security rules as canvas data
- Only group members can read/write history
- Each user's changes are attributed to their user ID

### Performance
- History is loaded on-demand (only when panel is opened)
- Queries are indexed for fast retrieval
- Most recent changes appear first

### Firestore Index
The feature requires a composite index on the `history` collection:
```json
{
  "collectionGroup": "history",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "shapeId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

## Implementation Files

### Core Files
- **`src/types.ts`**: ShapeHistoryEntry interface definition
- **`src/hooks/useShapeHistory.ts`**: Hook for managing shape history
- **`src/components/ShapeHistoryPanel.tsx`**: UI component for displaying history
- **`src/hooks/useShapes.ts`**: Modified to track history on shape operations
- **`src/App.tsx`**: Integration of history feature into main app
- **`src/components/Toolbar.tsx`**: History button in toolbar

### Configuration Files
- **`firestore.indexes.json`**: Firestore composite index configuration

## Future Enhancements

Potential improvements for the history feature:
- Add filters (by user, by action type, by date range)
- Export history as JSON or CSV
- Diff view showing changes between versions
- Bulk restore (restore multiple shapes at once)
- History search functionality
- Configurable history retention period
- Comparison view (side-by-side with current version)

