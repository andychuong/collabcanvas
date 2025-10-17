import { useState, useCallback, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useGroupAuth } from './hooks/useGroupAuth';
import { useShapes } from './hooks/useShapes';
import { useCursors } from './hooks/useCursors';
import { usePresence } from './hooks/usePresence';
import { useUndo } from './hooks/useUndo';
import { useSelections } from './hooks/useSelections';
import { Auth } from './components/Auth';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Footer } from './components/Footer';
import { AIChat } from './components/AIChat';
import { Shape, ShapeType, ViewportState } from './types';
import { getUserColor, hexToRgba } from './utils/colors';
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
  
  const { shapes: firestoreShapes, loading: shapesLoading, addShape, updateShape, batchUpdateShapes, throttledUpdateShape, deleteShape } = useShapes(groupId);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  
  // Local optimistic updates for shapes being actively manipulated
  const [localShapeUpdates, setLocalShapeUpdates] = useState<Map<string, Shape>>(new Map());
  
  // Merge Firestore shapes with local updates (last write wins based on timestamp)
  const shapes = (() => {
    // Start with Firestore shapes and apply local updates
    const shapeMap = new Map<string, Shape>();
    
    // Add all Firestore shapes
    firestoreShapes.forEach(shape => {
      shapeMap.set(shape.id, shape);
    });
    
    // Apply local updates (including new shapes not yet in Firestore)
    localShapeUpdates.forEach((localShape, id) => {
      const firestoreShape = shapeMap.get(id);
      
      if (!firestoreShape) {
        // New shape not yet in Firestore, use local version
        shapeMap.set(id, localShape);
      } else if (localShape.updatedAt > firestoreShape.updatedAt) {
        // Local is newer, use it
        shapeMap.set(id, localShape);
      }
      // Otherwise keep Firestore version (it's newer)
    });
    
    // Convert back to array and sort by creation time
    return Array.from(shapeMap.values()).sort((a, b) => a.createdAt - b.createdAt);
  })();
  
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
  const [circleInProgress, setCircleInProgress] = useState<{ shapeId: string; centerX: number; centerY: number } | null>(null);
  const [circleJustFinalized, setCircleJustFinalized] = useState<string | null>(null); // Track circle ID that was just finalized
  const [aiChatOpen, setAiChatOpen] = useState(false);
  
  // Undo/Redo functionality
  const { undo, redo, canUndo, canRedo, addToHistory, finishRestoring } = useUndo(shapes);

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

  // Helper to add shape with local optimistic update
  const addShapeOptimistic = useCallback((shape: Shape) => {
    // Immediately add to local state for instant feedback
    setLocalShapeUpdates(prev => {
      const next = new Map(prev);
      next.set(shape.id, shape);
      return next;
    });
    
    // Then sync to Firestore
    addShape(shape);
  }, [addShape]);

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
    
    // Cancel any circle in progress
    if (circleInProgress) {
      deleteShape(circleInProgress.shapeId);
      setCircleInProgress(null);
    }
    
    // Enter placement mode instead of creating shape immediately
    setShapeToPlace(type);
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    // Exit select mode when adding a shape
    setIsSelectMode(false);
  }, [user, lineInProgress, rectangleInProgress, circleInProgress, deleteShape]);

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
      // Also cancel any circle in progress
      if (circleInProgress) {
        deleteShape(circleInProgress.shapeId);
        setCircleInProgress(null);
      }
    }
  }, [isSelectMode, lineInProgress, rectangleInProgress, circleInProgress, deleteShape]);

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
          zIndex: 0,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShapeOptimistic(shape);
        setLineInProgress({ shapeId: shape.id, startX: x, startY: y });
        // Don't exit placement mode yet
        return;
      } else {
        // Second click: finalize the line
        setLineInProgress(null);
        setShapeToPlace(null); // Exit placement mode
        setSelectedShapeId(lineInProgress.shapeId);
        setSelectedShapeIds([lineInProgress.shapeId]);
        
        // Add to history after line is finalized
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
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
          fill: hexToRgba('#D0D0D0', 0.1), // Light gray with 90% transparency (10% opacity)
          width: 1,
          height: 1,
          stroke: '#000000',
          strokeWidth: 2,
          zIndex: 0,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShapeOptimistic(shape);
        setRectangleInProgress({ shapeId: shape.id, startX: x, startY: y });
        // Don't exit placement mode yet
        return;
      } else {
        // Second click: finalize the rectangle
        setRectangleInProgress(null);
        setShapeToPlace(null);
        setSelectedShapeId(rectangleInProgress.shapeId);
        setSelectedShapeIds([rectangleInProgress.shapeId]);
        
        // Add to history after rectangle is finalized
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
        return;
      }
    }

    // Special handling for circle placement (two-step process)
    if (shapeToPlace === 'circle') {
      if (!circleInProgress) {
        // First click: place the center
        const shape: Shape = {
          id: uuidv4(),
          type: 'circle',
          x,
          y,
          fill: hexToRgba('#D0D0D0', 0.1), // Light gray with 90% transparency (10% opacity)
          radius: 1, // Start with minimal radius
          stroke: '#000000',
          strokeWidth: 2,
          zIndex: 0,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShapeOptimistic(shape);
        setCircleInProgress({ shapeId: shape.id, centerX: x, centerY: y });
        // Don't exit placement mode yet
        return;
      } else {
        // Second click: finalize the circle
        // Calculate and set the final radius at click position
        const dx = x - circleInProgress.centerX;
        const dy = y - circleInProgress.centerY;
        const finalRadius = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        
        // Find the circle (it should be in shapes from first click)
        const circleShape = shapes.find(s => s.id === circleInProgress.shapeId);
        
        if (circleShape) {
          const finalShape: Shape = {
            ...circleShape,
            radius: finalRadius,
            updatedAt: Date.now(),
          };
          
          // Write the final state immediately
          updateShape(finalShape);
          
          // Flag this circle as just finalized - useEffect will add to history when synced
          setCircleJustFinalized(circleInProgress.shapeId);
        }
        
        setCircleInProgress(null);
        setShapeToPlace(null);
        setSelectedShapeId(circleInProgress.shapeId);
        setSelectedShapeIds([circleInProgress.shapeId]);
        
        return;
      }
    }

    // Regular shape placement for other shapes (text only now)
    const shape: Shape = {
      id: uuidv4(),
      type: shapeToPlace,
      x,
      y,
      fill: shapeToPlace === 'text' ? '#000000' : 'transparent',
      zIndex: 0,
      createdBy: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (shapeToPlace === 'text') {
      shape.text = 'Double click to edit';
      shape.fontSize = 24;
      shape.fontFamily = 'Arial';
      shape.fontWeight = 'normal';
      shape.fontStyle = 'normal';
      shape.textDecoration = 'none';
    }

    addShapeOptimistic(shape);
    setSelectedShapeId(shape.id);
    setSelectedShapeIds([shape.id]);
    setShapeToPlace(null); // Exit placement mode
    
    // Add to history after shape is created
    setTimeout(() => {
      addToHistory([...shapes, shape]);
    }, 100);
  }, [user, shapeToPlace, addShape, lineInProgress, rectangleInProgress, circleInProgress, shapes, addToHistory]);

  // Use optimistic local updates with throttled Firestore writes
  const handleShapeUpdate = useCallback((shape: Shape, immediate = false) => {
    // Always update local state immediately for visual feedback
    setLocalShapeUpdates(prev => {
      const next = new Map(prev);
      next.set(shape.id, shape);
      return next;
    });
    
    // Write to Firestore (throttled or immediate)
    if (immediate) {
      // For immediate updates (drag end, resize end), update Firestore immediately
      updateShape(shape);
      
      // Build the updated shapes array for history
      // This ensures we capture the exact state after this update
      const updatedShapes = shapes.map(s => s.id === shape.id ? shape : s);
      
      // Add to history with the correct state
      // Use setTimeout to ensure React finishes any pending state updates
      setTimeout(() => {
        addToHistory(updatedShapes);
      }, 100);
    } else {
      // For throttled updates (during drag), use throttled Firestore writes
      throttledUpdateShape(shape);
    }
  }, [updateShape, throttledUpdateShape, addToHistory, shapes]);

  const handleDeleteSelected = useCallback(() => {
    // Delete all selected shapes
    if (selectedShapeIds.length > 0) {
      selectedShapeIds.forEach(id => deleteShape(id));
      setSelectedShapeId(null);
      setSelectedShapeIds([]);
      
      // Add to history after delete
      setTimeout(() => {
        const remainingShapes = shapes.filter(s => !selectedShapeIds.includes(s.id));
        addToHistory(remainingShapes);
      }, 100);
    } else if (selectedShapeId) {
      // Fallback to single selection
      deleteShape(selectedShapeId);
      setSelectedShapeId(null);
      setSelectedShapeIds([]);
      
      // Add to history after delete
      setTimeout(() => {
        const remainingShapes = shapes.filter(s => s.id !== selectedShapeId);
        addToHistory(remainingShapes);
      }, 100);
    }
  }, [selectedShapeId, selectedShapeIds, deleteShape, shapes, addToHistory]);

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
            zIndex: (shapeToDuplicate.zIndex || 0) + 1,
            createdBy: user.uid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          addShapeOptimistic(newShape);
          newShapeIds.push(newShape.id);
        }
      });
      if (newShapeIds.length > 0) {
        setSelectedShapeId(newShapeIds[0]);
        setSelectedShapeIds(newShapeIds);
        
        // Add to history after duplicate
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
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
          zIndex: (shapeToDuplicate.zIndex || 0) + 1,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addShapeOptimistic(newShape);
        setSelectedShapeId(newShape.id);
        setSelectedShapeIds([newShape.id]);
        
        // Add to history after duplicate
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
      }
    }
  }, [selectedShapeId, selectedShapeIds, shapes, user, addShape, addToHistory]);

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

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

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

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

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

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleFontFamilyChange = useCallback((fontFamily: string) => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only update font family for text
    if (shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontFamily,
      updatedAt: Date.now(),
    };

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleFontWeightChange = useCallback((fontWeight: 'normal' | 'bold') => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only update font weight for text
    if (shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontWeight,
      updatedAt: Date.now(),
    };

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleFontStyleChange = useCallback((fontStyle: 'normal' | 'italic') => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only update font style for text
    if (shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontStyle,
      updatedAt: Date.now(),
    };

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleTextDecorationChange = useCallback((textDecoration: 'none' | 'underline') => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only update text decoration for text
    if (shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      textDecoration,
      updatedAt: Date.now(),
    };

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handlePositionChange = useCallback((x: number, y: number) => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const updatedShape: Shape = {
      ...shape,
      x,
      y,
      updatedAt: Date.now(),
    };

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleRotateLeft = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only rotate rectangles
    if (shape.type !== 'rectangle') return;

    const currentRotation = shape.rotation || 0;
    const newRotation = currentRotation - 90;

    const updatedShape: Shape = {
      ...shape,
      rotation: newRotation,
      updatedAt: Date.now(),
    };

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleRotateRight = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Only rotate rectangles
    if (shape.type !== 'rectangle') return;

    const currentRotation = shape.rotation || 0;
    const newRotation = currentRotation + 90;

    const updatedShape: Shape = {
      ...shape,
      rotation: newRotation,
      updatedAt: Date.now(),
    };

    // Use immediate update to trigger history
    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleBringToFront = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Find the max zIndex
    const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);

    const updatedShape: Shape = {
      ...shape,
      zIndex: maxZIndex + 1,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleSendToBack = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Find the min zIndex
    const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);

    const updatedShape: Shape = {
      ...shape,
      zIndex: minZIndex - 1,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleBringForward = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const currentZ = shape.zIndex || 0;

    const updatedShape: Shape = {
      ...shape,
      zIndex: currentZ + 1,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleSendBackward = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const currentZ = shape.zIndex || 0;

    const updatedShape: Shape = {
      ...shape,
      zIndex: currentZ - 1,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

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
      
      // Clear the restoring flag after a delay to allow Firestore to sync
      setTimeout(() => {
        finishRestoring();
      }, 500);
    }
  }, [undo, shapes, user, deleteShape, updateShape, addShape, finishRestoring]);

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
  }, [redo, shapes, user, deleteShape, updateShape, addShape, finishRestoring]);

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
  }, [updateCursor, lineInProgress, rectangleInProgress, circleInProgress, shapeToPlace, shapes, handleShapeUpdate]);

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

      // Arrow keys - move selected shapes (only when not editing text)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isEditingText) {
        if (selectedShapeIds.length > 0 || selectedShapeId) {
          e.preventDefault();
          
          // Determine movement distance (1px normal, 10px with Shift)
          const distance = e.shiftKey ? 10 : 1;
          
          // Calculate delta based on arrow key
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = -distance;
          if (e.key === 'ArrowDown') dy = distance;
          if (e.key === 'ArrowLeft') dx = -distance;
          if (e.key === 'ArrowRight') dx = distance;
          
          // Get the shapes to move
          const shapeIdsToMove = selectedShapeIds.length > 0 ? selectedShapeIds : (selectedShapeId ? [selectedShapeId] : []);
          
          // Update each selected shape
          shapeIdsToMove.forEach(shapeId => {
            const shape = shapes.find(s => s.id === shapeId);
            if (shape) {
              const updatedShape: Shape = {
                ...shape,
                x: shape.x + dx,
                y: shape.y + dy,
                updatedAt: Date.now(),
              };
              handleShapeUpdate(updatedShape, true); // Use immediate update for keyboard movements
            }
          });
          return;
        }
      }

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
        } else if (circleInProgress) {
          // Delete the in-progress circle and cancel
          deleteShape(circleInProgress.shapeId);
          setCircleInProgress(null);
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
  }, [selectedShapeId, selectedShapeIds, shapeToPlace, lineInProgress, rectangleInProgress, circleInProgress, handleDeleteSelected, handleUndo, handleRedo, setIsSelectMode, deleteShape, getInitialViewport, shapes, handleShapeUpdate]);

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
        userId={user.uid}
        canvasWidth={window.innerWidth}
        canvasHeight={window.innerHeight - 104}
      />
    </div>
  );
}

export default App;

