import { useState, useCallback, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useShapes } from './hooks/useShapes';
import { useCursors } from './hooks/useCursors';
import { usePresence } from './hooks/usePresence';
import { useUndo } from './hooks/useUndo';
import { Auth } from './components/Auth';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Footer } from './components/Footer';
import { Shape, ShapeType, ViewportState } from './types';
import { getUserColor, getRandomColor } from './utils/colors';

/**
 * COLLABORATIVE EDITING & CONFLICT RESOLUTION STRATEGY:
 * 
 * This app uses a "Last Write Wins" (LWW) approach based on timestamps:
 * 
 * 1. LOCAL OPTIMISTIC UPDATES:
 *    - When a user edits a shape, it updates immediately in local state
 *    - This provides instant visual feedback with no lag
 * 
 * 2. THROTTLED FIRESTORE WRITES:
 *    - Local updates are written to Firestore every 50ms (throttled)
 *    - Each write gets a fresh timestamp = current time
 *    - Reduces database load during rapid interactions (drag/resize)
 * 
 * 3. REAL-TIME SYNCHRONIZATION:
 *    - All clients listen to Firestore via real-time snapshots
 *    - When updates arrive, timestamps are compared
 * 
 * 4. CONFLICT RESOLUTION (Last Write Wins):
 *    - If Firestore timestamp >= local timestamp: Use Firestore (another user won)
 *    - If local timestamp > Firestore timestamp: Keep local (pending sync)
 *    - This ensures the most recent change always wins
 * 
 * 5. EDGE CASES:
 *    - If two users edit simultaneously, the last one to finish wins
 *    - Users see conflicts resolved in real-time via console logs
 *    - No data loss - just last change takes precedence
 */
function App() {
  const { user, loading: authLoading } = useAuth();
  const { shapes: firestoreShapes, loading: shapesLoading, addShape, updateShape, throttledUpdateShape, deleteShape } = useShapes();
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  
  // Local optimistic updates for shapes being actively manipulated
  const [localShapeUpdates, setLocalShapeUpdates] = useState<Map<string, Shape>>(new Map());
  
  // Merge Firestore shapes with local updates (last write wins based on timestamp)
  const shapes = firestoreShapes.map(shape => {
    const localUpdate = localShapeUpdates.get(shape.id);
    
    if (localUpdate) {
      // If we have a local update, compare timestamps
      // Only use local if it's actually newer (handles concurrent edits)
      if (localUpdate.updatedAt > shape.updatedAt) {
        return localUpdate; // Local is newer, use it (pending sync)
      } else {
        // Firestore is newer or equal - another user's change wins
        return shape; // Firestore is newer or equal, use it (last write wins)
      }
    }
    
    return shape; // No local update, use Firestore version
  });
  
  // Clean up local updates after Firestore sync (last write wins)
  // If Firestore has a newer or equal timestamp, prefer it over local updates
  useEffect(() => {
    if (localShapeUpdates.size > 0) {
      setLocalShapeUpdates(prev => {
        const next = new Map(prev);
        let hasChanges = false;
        
        prev.forEach((localShape, id) => {
          const firestoreShape = firestoreShapes.find(s => s.id === id);
          
          if (firestoreShape) {
            // LAST WRITE WINS: If Firestore version is newer or equal, clear local update
            // This ensures that updates from other users always take precedence when newer
            if (firestoreShape.updatedAt >= localShape.updatedAt) {
              next.delete(id);
              hasChanges = true;
            }
            // If local is newer, it means we have pending changes that haven't synced yet
            // Keep the local update until Firestore catches up
          }
        });
        
        return hasChanges ? next : prev;
      });
    }
  }, [firestoreShapes, localShapeUpdates]);
  
  // Calculate initial centered viewport
  const getInitialViewport = useCallback((): ViewportState => {
    const width = window.innerWidth;
    const height = window.innerHeight - 104; // 60px toolbar + 44px footer
    return {
      x: width / 2,
      y: height / 2,
      scale: 0.5, // 50% zoom
    };
  }, []);
  
  const [viewport, setViewport] = useState<ViewportState>(getInitialViewport());
  const [userName, setUserName] = useState('');
  const [userColor, setUserColor] = useState('');
  const [showMinimap, setShowMinimap] = useState(false);
  const [shapeToPlace, setShapeToPlace] = useState<ShapeType | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [lineInProgress, setLineInProgress] = useState<{ shapeId: string; startX: number; startY: number } | null>(null);
  const [rectangleInProgress, setRectangleInProgress] = useState<{ shapeId: string; startX: number; startY: number } | null>(null);
  
  // Undo/Redo functionality
  const { undo, redo, canUndo, canRedo } = useUndo(shapes);

  // Fetch user data
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || user.displayName || 'Anonymous');
          setUserColor(userData.color || getUserColor(user.uid));
        } else {
          setUserName(user.displayName || 'Anonymous');
          setUserColor(getUserColor(user.uid));
        }
      };
      fetchUserData();
    }
  }, [user]);

  const { cursors, updateCursor } = useCursors(
    user?.uid || null,
    userName,
    userColor
  );

  const { onlineUsers, markOffline } = usePresence(
    user?.uid || null,
    userName,
    user?.email || undefined,
    userColor
  );

  const handleAddShape = useCallback((type: ShapeType) => {
    if (!user) return;
    
    // Cancel any line in progress
    if (lineInProgress) {
      deleteShape(lineInProgress.shapeId);
      setLineInProgress(null);
    }
    
    // Cancel any rectangle in progress
    if (rectangleInProgress) {
      deleteShape(rectangleInProgress.shapeId);
      setRectangleInProgress(null);
    }
    
    // Enter placement mode instead of creating shape immediately
    setShapeToPlace(type);
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    // Exit select mode when adding a shape
    setIsSelectMode(false);
  }, [user, lineInProgress, rectangleInProgress, deleteShape]);

  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    // Cancel placement mode when entering select mode
    if (!isSelectMode) {
      setShapeToPlace(null);
      // Also cancel any line in progress
      if (lineInProgress) {
        deleteShape(lineInProgress.shapeId);
        setLineInProgress(null);
      }
      // Also cancel any rectangle in progress
      if (rectangleInProgress) {
        deleteShape(rectangleInProgress.shapeId);
        setRectangleInProgress(null);
      }
    }
  }, [isSelectMode, lineInProgress, rectangleInProgress, deleteShape]);

  const handleExitSelectMode = useCallback(() => {
    setIsSelectMode(false);
  }, []);

  const handlePlaceShape = useCallback((x: number, y: number) => {
    if (!user || !shapeToPlace) return;

    // Special handling for line placement (two-step process)
    if (shapeToPlace === 'line') {
      if (!lineInProgress) {
        // First click: place the first anchor
        const shape: Shape = {
          id: uuidv4(),
          type: 'line',
          x,
          y,
          fill: '',
          points: [0, 0, 0, 0], // Start with both points at the same location
          stroke: '#000000',
          strokeWidth: 2,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShape(shape);
        setLineInProgress({ shapeId: shape.id, startX: x, startY: y });
        // Don't exit placement mode yet
        return;
      } else {
        // Second click: finalize the line
        setLineInProgress(null);
        setShapeToPlace(null); // Exit placement mode
        setSelectedShapeId(lineInProgress.shapeId);
        setSelectedShapeIds([lineInProgress.shapeId]);
        return;
      }
    }

    // Special handling for rectangle placement (two-step process)
    if (shapeToPlace === 'rectangle') {
      if (!rectangleInProgress) {
        // First click: place the first corner
        const shape: Shape = {
          id: uuidv4(),
          type: 'rectangle',
          x,
          y,
          fill: 'transparent',
          width: 1,
          height: 1,
          stroke: '#000000',
          strokeWidth: 2,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShape(shape);
        setRectangleInProgress({ shapeId: shape.id, startX: x, startY: y });
        // Don't exit placement mode yet
        return;
      } else {
        // Second click: finalize the rectangle
        setRectangleInProgress(null);
        setShapeToPlace(null);
        setSelectedShapeId(rectangleInProgress.shapeId);
        setSelectedShapeIds([rectangleInProgress.shapeId]);
        return;
      }
    }

    // Regular shape placement for other shapes
    const shape: Shape = {
      id: uuidv4(),
      type: shapeToPlace,
      x,
      y,
      fill: shapeToPlace === 'text' ? '#000000' : 'transparent',
      createdBy: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (shapeToPlace === 'circle') {
      shape.radius = 60;
      shape.stroke = '#000000';
      shape.strokeWidth = 2;
    } else if (shapeToPlace === 'text') {
      shape.text = 'Double click to edit';
      shape.fontSize = 24;
    }

    addShape(shape);
    setSelectedShapeId(shape.id);
    setSelectedShapeIds([shape.id]);
    setShapeToPlace(null); // Exit placement mode
  }, [user, shapeToPlace, addShape, lineInProgress, rectangleInProgress]);

  // Use optimistic local updates with throttled Firestore writes
  const handleShapeUpdate = useCallback((shape: Shape, immediate = false) => {
    // Always update local state immediately for smooth visuals
    setLocalShapeUpdates(prev => {
      const next = new Map(prev);
      next.set(shape.id, shape);
      return next;
    });
    
    // Write to Firestore (throttled or immediate)
    if (immediate) {
      updateShape(shape);
      // Clear local update after immediate write
      setLocalShapeUpdates(prev => {
        const next = new Map(prev);
        next.delete(shape.id);
        return next;
      });
    } else {
      throttledUpdateShape(shape);
    }
  }, [updateShape, throttledUpdateShape]);

  const handleDeleteSelected = useCallback(() => {
    // Delete all selected shapes
    if (selectedShapeIds.length > 0) {
      selectedShapeIds.forEach(id => deleteShape(id));
      setSelectedShapeId(null);
      setSelectedShapeIds([]);
    } else if (selectedShapeId) {
      // Fallback to single selection
      deleteShape(selectedShapeId);
      setSelectedShapeId(null);
      setSelectedShapeIds([]);
    }
  }, [selectedShapeId, selectedShapeIds, deleteShape]);

  const handleDuplicate = useCallback(() => {
    if (!user) return;

    // Duplicate all selected shapes
    if (selectedShapeIds.length > 0) {
      const newShapeIds: string[] = [];
      selectedShapeIds.forEach(shapeId => {
        const shapeToDuplicate = shapes.find(s => s.id === shapeId);
        if (shapeToDuplicate) {
          const newShape: Shape = {
            ...shapeToDuplicate,
            id: uuidv4(),
            x: shapeToDuplicate.x + 20,
            y: shapeToDuplicate.y + 20,
            createdBy: user.uid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addShape(newShape);
          newShapeIds.push(newShape.id);
        }
      });
      if (newShapeIds.length > 0) {
        setSelectedShapeId(newShapeIds[0]);
        setSelectedShapeIds(newShapeIds);
      }
    } else if (selectedShapeId) {
      // Fallback to single selection
      const shapeToDuplicate = shapes.find(s => s.id === selectedShapeId);
      if (shapeToDuplicate) {
        const newShape: Shape = {
          ...shapeToDuplicate,
          id: uuidv4(),
          x: shapeToDuplicate.x + 20,
          y: shapeToDuplicate.y + 20,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addShape(newShape);
        setSelectedShapeId(newShape.id);
        setSelectedShapeIds([newShape.id]);
      }
    }
  }, [selectedShapeId, selectedShapeIds, shapes, user, addShape]);

  const handleColorChange = useCallback((color: string) => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const updatedShape: Shape = {
      ...shape,
      updatedAt: Date.now(),
    };

    // For shapes with strokes (lines, rectangles, circles), update stroke
    // For text, update fill
    if (shape.type === 'line' || shape.type === 'rectangle' || shape.type === 'circle') {
      updatedShape.stroke = color;
    } else {
      updatedShape.fill = color;
    }

    updateShape(updatedShape);
  }, [selectedShapeId, selectedShapeIds, shapes, updateShape]);

  const handleFillColorChange = useCallback((color: string) => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only update fill for rectangles and circles
    if (shape.type !== 'rectangle' && shape.type !== 'circle') return;

    const updatedShape: Shape = {
      ...shape,
      fill: color,
      updatedAt: Date.now(),
    };

    updateShape(updatedShape);
  }, [selectedShapeId, selectedShapeIds, shapes, updateShape]);

  const handleFontSizeChange = useCallback((size: number) => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only update font size for text
    if (shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontSize: size,
      updatedAt: Date.now(),
    };

    updateShape(updatedShape);
  }, [selectedShapeId, selectedShapeIds, shapes, updateShape]);

  const handleUndo = useCallback(async () => {
    const previousShapes = undo();
    if (previousShapes && user) {
      // Sync the historical state back to Firestore
      const currentShapeIds = new Set(shapes.map(s => s.id));
      const previousShapeIds = new Set(previousShapes.map(s => s.id));
      
      // Delete shapes that exist now but not in history
      for (const shape of shapes) {
        if (!previousShapeIds.has(shape.id)) {
          deleteShape(shape.id);
        }
      }
      
      // Add or update shapes from history
      for (const shape of previousShapes) {
        if (currentShapeIds.has(shape.id)) {
          updateShape(shape);
        } else {
          addShape(shape);
        }
      }
    }
  }, [undo, shapes, user, deleteShape, updateShape, addShape]);

  const handleRedo = useCallback(async () => {
    const nextShapes = redo();
    if (nextShapes && user) {
      // Sync the future state back to Firestore
      const currentShapeIds = new Set(shapes.map(s => s.id));
      const nextShapeIds = new Set(nextShapes.map(s => s.id));
      
      // Delete shapes that exist now but not in future state
      for (const shape of shapes) {
        if (!nextShapeIds.has(shape.id)) {
          deleteShape(shape.id);
        }
      }
      
      // Add or update shapes from future state
      for (const shape of nextShapes) {
        if (currentShapeIds.has(shape.id)) {
          updateShape(shape);
        } else {
          addShape(shape);
        }
      }
    }
  }, [redo, shapes, user, deleteShape, updateShape, addShape]);

  const handleLogout = useCallback(async () => {
    try {
      // Mark user offline BEFORE signing out (while still authenticated)
      await markOffline();
      
      // Now sign out
      await signOut(auth);
      setSelectedShapeId(null);
      setViewport(getInitialViewport());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [markOffline, getInitialViewport]);

  const handleCursorMove = useCallback((x: number, y: number) => {
    updateCursor(x, y);
    
    // If we're in the middle of placing a line, update its second point
    if (lineInProgress && shapeToPlace === 'line') {
      const lineShape = shapes.find(s => s.id === lineInProgress.shapeId);
      if (lineShape) {
        const updatedShape: Shape = {
          ...lineShape,
          points: [0, 0, x - lineInProgress.startX, y - lineInProgress.startY],
          updatedAt: Date.now(),
        };
        updateShape(updatedShape);
      }
    }
    
    // If we're in the middle of placing a rectangle, update its dimensions
    if (rectangleInProgress && shapeToPlace === 'rectangle') {
      const rectangleShape = shapes.find(s => s.id === rectangleInProgress.shapeId);
      if (rectangleShape) {
        const width = Math.abs(x - rectangleInProgress.startX);
        const height = Math.abs(y - rectangleInProgress.startY);
        const newX = Math.min(x, rectangleInProgress.startX);
        const newY = Math.min(y, rectangleInProgress.startY);
        
        const updatedShape: Shape = {
          ...rectangleShape,
          x: newX,
          y: newY,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          updatedAt: Date.now(),
        };
        updateShape(updatedShape);
      }
    }
  }, [updateCursor, lineInProgress, rectangleInProgress, shapeToPlace, shapes, updateShape]);

  const handleViewportChange = useCallback((newViewport: ViewportState) => {
    setViewport(newViewport);
  }, []);

  const handleViewportInteraction = useCallback((isInteracting: boolean) => {
    setShowMinimap(isInteracting);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're editing text (don't trigger shortcuts in text fields)
      const isEditingText = (e.target as HTMLElement)?.tagName === 'TEXTAREA' || 
                           (e.target as HTMLElement)?.tagName === 'INPUT';

      // Spacebar - reset viewport to original view (only when not editing text)
      if (e.key === ' ' && !isEditingText) {
        e.preventDefault();
        setViewport(getInitialViewport());
        return;
      }

      // Escape key - cancel placement mode or deselect
      if (e.key === 'Escape') {
        if (lineInProgress) {
          // Delete the in-progress line and cancel
          deleteShape(lineInProgress.shapeId);
          setLineInProgress(null);
          setShapeToPlace(null);
        } else if (rectangleInProgress) {
          // Delete the in-progress rectangle and cancel
          deleteShape(rectangleInProgress.shapeId);
          setRectangleInProgress(null);
          setShapeToPlace(null);
        } else if (shapeToPlace) {
          setShapeToPlace(null);
        } else {
          setSelectedShapeId(null);
          setSelectedShapeIds([]);
        }
        return;
      }

      // V key - toggle select mode (only when not editing text)
      if (e.key === 'v' && !isEditingText) {
        e.preventDefault();
        setIsSelectMode(prev => !prev);
        setShapeToPlace(null); // Cancel placement mode
        return;
      }

      // Undo with Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo with Ctrl+Y or Ctrl+Shift+Z (or Cmd+Y / Cmd+Shift+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }

      // Delete selected shape(s) with Delete or Backspace (only when not editing text)
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedShapeId || selectedShapeIds.length > 0) && !isEditingText) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, selectedShapeIds, shapeToPlace, lineInProgress, rectangleInProgress, handleDeleteSelected, handleUndo, handleRedo, setIsSelectMode, deleteShape, getInitialViewport]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (shapesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <Toolbar
        onAddShape={handleAddShape}
        onDeleteSelected={handleDeleteSelected}
        onDuplicate={handleDuplicate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onLogout={handleLogout}
        selectedShapeIds={selectedShapeIds}
        currentUserId={user.uid}
        onlineUsers={onlineUsers}
        shapes={shapes}
        onColorChange={handleColorChange}
        onFillColorChange={handleFillColorChange}
        onFontSizeChange={handleFontSizeChange}
        isSelectMode={isSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
      />
      
      {/* Full-width content container */}
      <div className="flex items-stretch justify-center h-full pt-[60px] pb-[44px]">
        <div className="flex items-stretch w-full h-full">
          {/* Canvas container - fills available space */}
          <div className="flex-1 w-full h-full">
            <Canvas
              shapes={shapes}
              cursors={cursors}
              onShapeUpdate={handleShapeUpdate}
              onShapeSelect={setSelectedShapeId}
              onMultiSelect={setSelectedShapeIds}
              selectedShapeId={selectedShapeId}
              selectedShapeIds={selectedShapeIds}
              onCursorMove={handleCursorMove}
              viewport={viewport}
              onViewportChange={handleViewportChange}
              onViewportInteraction={handleViewportInteraction}
              showMinimap={showMinimap}
              shapeToPlace={shapeToPlace}
              onPlaceShape={handlePlaceShape}
              isSelectMode={isSelectMode}
              onExitSelectMode={handleExitSelectMode}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;

