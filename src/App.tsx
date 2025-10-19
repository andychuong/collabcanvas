import { useState, useCallback, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useGroupAuth } from './hooks/useGroupAuth';
import { useShapes } from './hooks/useShapes';
import { useCursors } from './hooks/useCursors';
import { usePresence } from './hooks/usePresence';
import { useUndo } from './hooks/useUndo';
import { useSelections } from './hooks/useSelections';
import { useShapeOperations } from './hooks/useShapeOperations';
import { useStyleHandlers } from './hooks/useStyleHandlers';
import { useTransformHandlers } from './hooks/useTransformHandlers';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useOptimisticShapes } from './hooks/useOptimisticShapes';
import { useShapePlacement } from './hooks/useShapePlacement';
import { useShapeHistory } from './hooks/useShapeHistory';
import { Auth } from './components/Auth';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Footer } from './components/Footer';
import { AIChat } from './components/AIChat';
import { ShapeHistoryPanel } from './components/ShapeHistoryPanel';
import { Shape, ShapeType, ViewportState, ShapeHistoryEntry } from './types';
import { getUserColor } from './utils/colors';
import { APP_VERSION, VERSION_KEY } from './config/appVersion';
import { debugUserAuth } from './utils/debugAuth';

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
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Only fetch group data if user exists and we're not in the middle of registration
  const shouldFetchGroupData = user && !isRegistering;
  const { groupId, groupInfo, loading: groupLoading, error: groupError } = useGroupAuth(
    shouldFetchGroupData ? user.uid : null
  );
  
  // Version check - sign out users when app version changes (on deployment)
  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      // Version changed - sign out user and clear storage
      console.log(`App version changed from ${storedVersion} to ${APP_VERSION}. Signing out user.`);
      if (auth.currentUser) {
        signOut(auth);
      }
      localStorage.clear();
    }
    
    // Store current version
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }, []);
  
  const { shapes: firestoreShapes, loading: shapesLoading, addShape, updateShape, batchUpdateShapes, throttledBatchUpdate, throttledUpdateShape, deleteShape } = useShapes(groupId, user?.uid);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  
  // Undo/Redo functionality - needs to be before useOptimisticShapes
  const { undo, redo, canUndo, canRedo, addToHistory, finishRestoring } = useUndo(firestoreShapes);
  
  // Optimistic updates for shapes (provides merged shapes from Firestore + local updates)
  const { shapes, addShapeOptimistic, handleShapeUpdate, handleBatchShapeUpdate } = useOptimisticShapes(
    firestoreShapes,
    addShape,
    updateShape,
    throttledUpdateShape,
    throttledBatchUpdate,
    addToHistory
  );
  
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
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Shape history - only load when a single shape is selected
  const historyShapeId = selectedShapeIds.length === 1 ? selectedShapeIds[0] : (selectedShapeId || null);
  const { historyEntries, loading: historyLoading, restoreVersion } = useShapeHistory(
    groupId, 
    showHistory ? historyShapeId : null
  );
  
  // Helper functions for AI to access history
  const getShapeHistoryForAI = useCallback(async (shapeId: string): Promise<ShapeHistoryEntry[]> => {
    if (!groupId) return [];
    
    try {
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const historyRef = collection(db, 'groups', groupId, 'canvases', 'main-canvas', 'history');
      const historyQuery = query(
        historyRef,
        where('shapeId', '==', shapeId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(historyQuery);
      const entries: ShapeHistoryEntry[] = [];
      
      snapshot.forEach((doc) => {
        entries.push(doc.data() as ShapeHistoryEntry);
      });
      
      return entries;
    } catch (error) {
      console.error('Error fetching shape history for AI:', error);
      return [];
    }
  }, [groupId]);
  
  const restoreShapeVersionForAI = useCallback(async (entry: ShapeHistoryEntry) => {
    restoreVersion(entry, (shape, immediate) => handleShapeUpdate(shape, immediate || true));
  }, [restoreVersion, handleShapeUpdate]);
  
  // Shape placement state management (consolidates line/rectangle/arrow/circle in progress)
  const {
    lineInProgress,
    rectangleInProgress,
    arrowInProgress,
    circleInProgress,
    circleJustFinalized,
    setLineInProgress,
    setRectangleInProgress,
    setArrowInProgress,
    setCircleInProgress,
    setCircleJustFinalized,
  } = useShapePlacement();

  // Add to history when circle is finalized and Firestore has synced
  useEffect(() => {
    if (circleJustFinalized) {
      // Wait a moment for Firestore to sync, then add to history
      const timer = setTimeout(() => {
        addToHistory(shapes);
        setCircleJustFinalized(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [circleJustFinalized, shapes, addToHistory]);

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

  // Run debug utility when there's a group error
  useEffect(() => {
    if (groupError && user) {
      debugUserAuth();
    }
  }, [groupError, user]);

  const { cursors, updateCursor } = useCursors(
    user?.uid || null,
    userName,
    userColor,
    groupId
  );

  const { onlineUsers, markOffline } = usePresence(
    user?.uid || null,
    userName,
    user?.email || undefined,
    userColor,
    groupId
  );

  // Track selections from other users
  const [otherUsersSelections, setOtherUsersSelections] = useState<Map<string, { shapeIds: string[]; color: string; userName: string }>>(new Map());
  const { subscribeToSelections } = useSelections(
    user?.uid || null,
    userName,
    userColor,
    selectedShapeIds,
    groupId
  );

  // Subscribe to other users' selections
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSelections((selectionsMap) => {
      // Convert to a simpler format for rendering
      const simplified = new Map<string, { shapeIds: string[]; color: string; userName: string }>();
      selectionsMap.forEach((selection) => {
        simplified.set(selection.userId, {
          shapeIds: selection.shapeIds,
          color: selection.userColor,
          userName: selection.userName,
        });
      });
      setOtherUsersSelections(simplified);
    });

    return unsubscribe;
  }, [user, subscribeToSelections]);

  // Use custom hooks for handlers
  const {
    handleAddShape,
    handlePlaceShape,
    handleDeleteSelected,
    handleDuplicate,
    handleToggleSelectMode,
    handleExitSelectMode,
  } = useShapeOperations({
    user,
    shapes,
    addShape: addShapeOptimistic,
    updateShape,
    deleteShape,
    addToHistory,
    lineInProgress,
    setLineInProgress,
    rectangleInProgress,
    setRectangleInProgress,
    arrowInProgress,
    setArrowInProgress,
    circleInProgress,
    setCircleInProgress,
    setShapeToPlace,
    setSelectedShapeId,
    setSelectedShapeIds,
    setCircleJustFinalized,
    setIsSelectMode,
    shapeToPlace,
    selectedShapeId,
    selectedShapeIds,
    isSelectMode,
  });

  const {
    handleColorChange,
    handleFillColorChange,
    handleFontSizeChange,
    handleFontFamilyChange,
    handleFontWeightChange,
    handleFontStyleChange,
    handleTextDecorationChange,
    handlePositionChange,
  } = useStyleHandlers({
    shapes,
    selectedShapeId,
    selectedShapeIds,
    handleShapeUpdate,
  });

  const {
    handleRotateLeft,
    handleRotateRight,
    handleBringToFront,
    handleSendToBack,
    handleBringForward,
    handleSendBackward,
  } = useTransformHandlers({
    shapes,
    selectedShapeId,
    selectedShapeIds,
    handleShapeUpdate,
  });

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
          addShapeOptimistic(shape);
        }
      }
      
      // Wait for Firestore sync before continuing
      setTimeout(() => {
        finishRestoring();
      }, 500);
    }
  }, [undo, shapes, user, deleteShape, updateShape, addShapeOptimistic, finishRestoring]);

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
          addShapeOptimistic(shape);
        }
      }
      
      // Clear the restoring flag after a delay to allow Firestore to sync
      setTimeout(() => {
        finishRestoring();
      }, 500);
    }
  }, [redo, shapes, user, deleteShape, updateShape, addShapeOptimistic, finishRestoring]);

  const handleLogout = useCallback(async () => {
    try {
      // Mark user offline BEFORE signing out (while still authenticated)
      await markOffline();
      
      // Give Firestore listeners a moment to process the offline status
      // before we invalidate the auth token
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
        handleShapeUpdate(updatedShape, false); // Use throttled updates for smooth rendering
      }
    }
    
    // If we're in the middle of placing a rectangle, update its dimensions
    if (rectangleInProgress && shapeToPlace === 'rectangle') {
      const rectangleShape = shapes.find(s => s.id === rectangleInProgress.shapeId);
      if (rectangleShape) {
        const width = Math.abs(x - rectangleInProgress.startX);
        const height = Math.abs(y - rectangleInProgress.startY);
        const topLeftX = Math.min(x, rectangleInProgress.startX);
        const topLeftY = Math.min(y, rectangleInProgress.startY);
        // Calculate center position (since we use offsetX/offsetY in rendering)
        const centerX = topLeftX + width / 2;
        const centerY = topLeftY + height / 2;
        
        const updatedShape: Shape = {
          ...rectangleShape,
          x: centerX,
          y: centerY,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          updatedAt: Date.now(),
        };
        handleShapeUpdate(updatedShape, false); // Use throttled updates for smooth rendering
      }
    }
    
    // If we're in the middle of placing an arrow, update its dimensions
    if (arrowInProgress && shapeToPlace === 'arrow') {
      const arrowShape = shapes.find(s => s.id === arrowInProgress.shapeId);
      if (arrowShape) {
        const width = Math.abs(x - arrowInProgress.startX);
        const height = Math.abs(y - arrowInProgress.startY);
        const topLeftX = Math.min(x, arrowInProgress.startX);
        const topLeftY = Math.min(y, arrowInProgress.startY);
        // Calculate center position (since we use offsetX/offsetY in rendering)
        const centerX = topLeftX + width / 2;
        const centerY = topLeftY + height / 2;
        
        const updatedShape: Shape = {
          ...arrowShape,
          x: centerX,
          y: centerY,
          width: Math.max(width, 1),
          height: Math.max(height, 40), // Keep minimum height for arrow head
          updatedAt: Date.now(),
        };
        handleShapeUpdate(updatedShape, false); // Use throttled updates for smooth rendering
      }
    }
    
    // If we're in the middle of placing a circle, update its radius
    if (circleInProgress && shapeToPlace === 'circle') {
      const circleShape = shapes.find(s => s.id === circleInProgress.shapeId);
      if (circleShape) {
        // Calculate radius as distance from center to current mouse position
        const dx = x - circleInProgress.centerX;
        const dy = y - circleInProgress.centerY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        const updatedShape: Shape = {
          ...circleShape,
          radius: Math.max(radius, 1), // Ensure minimum radius of 1
          updatedAt: Date.now(),
        };
        handleShapeUpdate(updatedShape, false); // Use throttled updates for smooth rendering
      }
    }
  }, [updateCursor, lineInProgress, rectangleInProgress, arrowInProgress, circleInProgress, shapeToPlace, shapes, handleShapeUpdate]);

  const handleViewportChange = useCallback((newViewport: ViewportState) => {
    setViewport(newViewport);
  }, []);

  const handleViewportInteraction = useCallback((isInteracting: boolean) => {
    setShowMinimap(isInteracting);
  }, []);

  // Use custom hook for keyboard shortcuts
  useKeyboardShortcuts({
    selectedShapeId,
    selectedShapeIds,
    shapeToPlace,
    lineInProgress,
    rectangleInProgress,
    arrowInProgress,
    circleInProgress,
    handleDeleteSelected,
    handleUndo,
    handleRedo,
    setIsSelectMode,
    deleteShape,
    setLineInProgress,
    setRectangleInProgress,
    setArrowInProgress,
    setCircleInProgress,
    setShapeToPlace,
    setSelectedShapeId,
    setSelectedShapeIds,
    getInitialViewport,
    setViewport,
    shapes,
    handleShapeUpdate,
  });

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
    return <Auth onRegistrationStart={() => setIsRegistering(true)} onRegistrationComplete={() => setIsRegistering(false)} />;
  }
  
  // Show loading during registration setup
  if (isRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Setting up your account...</p>
          <p className="text-gray-500 text-sm mt-2">Creating your workspace</p>
        </div>
      </div>
    );
  }

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group data...</p>
        </div>
      </div>
    );
  }

  if (groupError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-red-800 mb-2">Group Setup Error</h2>
            <p className="text-red-700 mb-4">{groupError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  // Retry by refreshing the page
                  window.location.reload();
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={async () => {
                  await signOut(auth);
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Try clicking "Retry" first. If the issue persists, sign out and register again with a group name.
          </p>
        </div>
      </div>
    );
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
        onFontFamilyChange={handleFontFamilyChange}
        onFontWeightChange={handleFontWeightChange}
        onFontStyleChange={handleFontStyleChange}
        onTextDecorationChange={handleTextDecorationChange}
        onPositionChange={handlePositionChange}
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        isSelectMode={isSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
        groupName={groupInfo?.name}
        onShowHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
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
              onBatchUpdate={handleBatchShapeUpdate}
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
              otherUsersSelections={otherUsersSelections}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer onOpenAIChat={() => setAiChatOpen(true)} />
      
      {/* AI Chat Assistant */}
      <AIChat
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        shapes={shapes}
        addShape={addShapeOptimistic}
        updateShape={(shape) => handleShapeUpdate(shape, true)}
        batchUpdateShapes={batchUpdateShapes}
        deleteShape={deleteShape}
        getShapeHistory={getShapeHistoryForAI}
        restoreShapeVersion={restoreShapeVersionForAI}
        userId={user.uid}
        canvasWidth={window.innerWidth}
        canvasHeight={window.innerHeight - 104}
      />
      
      {/* Shape History Panel */}
      {showHistory && historyShapeId && (
        <ShapeHistoryPanel
          shapeId={historyShapeId}
          historyEntries={historyEntries}
          loading={historyLoading}
          onRestore={(entry) => {
            restoreVersion(entry, handleShapeUpdate);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

export default App;

