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
import { Shape, ShapeType, ViewportState } from './types';
import { getUserColor, getRandomColor } from './utils/colors';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { shapes, loading: shapesLoading, addShape, updateShape, deleteShape } = useShapes();
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const [userName, setUserName] = useState('');
  const [userColor, setUserColor] = useState('');
  const [showMinimap, setShowMinimap] = useState(false);
  const [shapeToPlace, setShapeToPlace] = useState<ShapeType | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
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
    // Enter placement mode instead of creating shape immediately
    setShapeToPlace(type);
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    // Exit select mode when adding a shape
    setIsSelectMode(false);
  }, [user]);

  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    // Cancel placement mode when entering select mode
    if (!isSelectMode) {
      setShapeToPlace(null);
    }
  }, [isSelectMode]);

  const handleExitSelectMode = useCallback(() => {
    setIsSelectMode(false);
  }, []);

  const handlePlaceShape = useCallback((x: number, y: number) => {
    if (!user || !shapeToPlace) return;

    const shape: Shape = {
      id: uuidv4(),
      type: shapeToPlace,
      x,
      y,
      fill: shapeToPlace === 'text' ? '#000000' : getRandomColor(),
      createdBy: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (shapeToPlace === 'rectangle') {
      shape.width = 150;
      shape.height = 100;
    } else if (shapeToPlace === 'circle') {
      shape.radius = 60;
    } else if (shapeToPlace === 'text') {
      shape.text = 'Double click to edit';
      shape.fontSize = 24;
    } else if (shapeToPlace === 'line') {
      shape.points = [0, 0, 100, 0];
      shape.stroke = getRandomColor();
      shape.strokeWidth = 2;
    }

    addShape(shape);
    setSelectedShapeId(shape.id);
    setSelectedShapeIds([shape.id]);
    setShapeToPlace(null); // Exit placement mode
  }, [user, shapeToPlace, addShape]);

  const handleShapeUpdate = useCallback((shape: Shape) => {
    updateShape(shape);
  }, [updateShape]);

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

    // For lines, update stroke; for other shapes, update fill
    if (shape.type === 'line') {
      updatedShape.stroke = color;
    } else {
      updatedShape.fill = color;
    }

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
      setViewport({ x: 0, y: 0, scale: 1 });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [markOffline]);

  const handleCursorMove = useCallback((x: number, y: number) => {
    updateCursor(x, y);
  }, [updateCursor]);

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
        setViewport({ x: 0, y: 0, scale: 1 });
        return;
      }

      // Escape key - cancel placement mode or deselect
      if (e.key === 'Escape') {
        if (shapeToPlace) {
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
  }, [selectedShapeId, selectedShapeIds, shapeToPlace, handleDeleteSelected, handleUndo, handleRedo, setIsSelectMode]);

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
        isSelectMode={isSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
      />
      
      {/* Centered content container */}
      <div className="flex items-center justify-center h-full pt-[60px]">
        <div className="flex items-start gap-4 max-w-[2000px] w-full justify-center px-4">
          {/* Canvas container */}
          <div className="flex-shrink-0">
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
          
          {/* Right sidebar with controls */}
          <div className="space-y-4 flex-shrink-0">
            <div className="bg-white border-4 border-gray-300 rounded-lg shadow-2xl p-4 w-64">
              <h3 className="font-semibold text-gray-800 mb-2">Controls</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>➕ <strong>Add shape:</strong> Click button, then canvas</li>
                <li>🖱️ <strong>Pan canvas:</strong> Left-click drag or middle mouse</li>
                <li>🔍 <strong>Zoom:</strong> Mouse wheel</li>
                <li>🏠 <strong>Reset view:</strong> Spacebar</li>
                <li>✋ <strong>Move:</strong> Drag shapes</li>
                <li>🎯 <strong>Select:</strong> Click shape</li>
                <li>🔘 <strong>Select mode:</strong> V key or button (auto-exits after use)</li>
                <li>📦 <strong>Multi-select:</strong> Select mode + drag box or Ctrl/Cmd + Click</li>
                <li>✏️ <strong>Edit text:</strong> Double-click text</li>
                <li>🗑️ <strong>Delete:</strong> Select + Delete key</li>
                <li>↶ <strong>Undo:</strong> Ctrl/Cmd + Z</li>
                <li>↷ <strong>Redo:</strong> Ctrl/Cmd + Y</li>
                <li>⎋ <strong>Cancel/Deselect:</strong> Escape key</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

