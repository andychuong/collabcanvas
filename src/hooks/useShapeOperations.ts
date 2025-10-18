import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Shape, ShapeType } from '../types';
import { hexToRgba } from '../utils/colors';

interface UseShapeOperationsProps {
  user: { uid: string } | null;
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (shape: Shape) => void;
  deleteShape: (shapeId: string) => void;
  addToHistory: (shapes: Shape[]) => void;
  lineInProgress: { shapeId: string; startX: number; startY: number } | null;
  setLineInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => void;
  rectangleInProgress: { shapeId: string; startX: number; startY: number } | null;
  setRectangleInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => void;
  arrowInProgress: { shapeId: string; startX: number; startY: number } | null;
  setArrowInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => void;
  circleInProgress: { shapeId: string; centerX: number; centerY: number } | null;
  setCircleInProgress: (value: { shapeId: string; centerX: number; centerY: number } | null) => void;
  setShapeToPlace: (type: ShapeType | null) => void;
  setSelectedShapeId: (id: string | null) => void;
  setSelectedShapeIds: (ids: string[]) => void;
  setCircleJustFinalized: (id: string | null) => void;
  setIsSelectMode: (value: boolean) => void;
  shapeToPlace: ShapeType | null;
  selectedShapeId: string | null;
  selectedShapeIds: string[];
  isSelectMode: boolean;
}

export const useShapeOperations = ({
  user,
  shapes,
  addShape,
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
}: UseShapeOperationsProps) => {
  
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
          points: [0, 0, 0, 0],
          stroke: '#000000',
          strokeWidth: 2,
          zIndex: 0,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShape(shape);
        setLineInProgress({ shapeId: shape.id, startX: x, startY: y });
        return;
      } else {
        // Second click: finalize the line
        setLineInProgress(null);
        setShapeToPlace(null);
        setSelectedShapeId(lineInProgress.shapeId);
        setSelectedShapeIds([lineInProgress.shapeId]);
        
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
        return;
      }
    }

    // Special handling for rectangle placement
    if (shapeToPlace === 'rectangle') {
      if (!rectangleInProgress) {
        const shape: Shape = {
          id: uuidv4(),
          type: 'rectangle',
          x,
          y,
          fill: hexToRgba('#D0D0D0', 0.1),
          width: 1,
          height: 1,
          stroke: '#000000',
          strokeWidth: 2,
          zIndex: 0,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShape(shape);
        setRectangleInProgress({ shapeId: shape.id, startX: x, startY: y });
        return;
      } else {
        setRectangleInProgress(null);
        setShapeToPlace(null);
        setSelectedShapeId(rectangleInProgress.shapeId);
        setSelectedShapeIds([rectangleInProgress.shapeId]);
        
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
        return;
      }
    }

    // Special handling for arrow placement
    if (shapeToPlace === 'arrow') {
      if (!arrowInProgress) {
        const shape: Shape = {
          id: uuidv4(),
          type: 'arrow',
          x,
          y,
          fill: '#000000',
          width: 1,
          height: 40,
          stroke: '#000000',
          strokeWidth: 2,
          zIndex: 0,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShape(shape);
        setArrowInProgress({ shapeId: shape.id, startX: x, startY: y });
        return;
      } else {
        setArrowInProgress(null);
        setShapeToPlace(null);
        setSelectedShapeId(arrowInProgress.shapeId);
        setSelectedShapeIds([arrowInProgress.shapeId]);
        
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
        return;
      }
    }

    // Special handling for circle placement
    if (shapeToPlace === 'circle') {
      if (!circleInProgress) {
        const shape: Shape = {
          id: uuidv4(),
          type: 'circle',
          x,
          y,
          fill: hexToRgba('#D0D0D0', 0.1),
          radius: 1,
          stroke: '#000000',
          strokeWidth: 2,
          zIndex: 0,
          createdBy: user.uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        addShape(shape);
        setCircleInProgress({ shapeId: shape.id, centerX: x, centerY: y });
        return;
      } else {
        const dx = x - circleInProgress.centerX;
        const dy = y - circleInProgress.centerY;
        const finalRadius = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        
        const circleShape = shapes.find(s => s.id === circleInProgress.shapeId);
        
        if (circleShape) {
          const finalShape: Shape = {
            ...circleShape,
            radius: finalRadius,
            updatedAt: Date.now(),
          };
          
          updateShape(finalShape);
          setCircleJustFinalized(circleInProgress.shapeId);
        }
        
        setCircleInProgress(null);
        setShapeToPlace(null);
        setSelectedShapeId(circleInProgress.shapeId);
        setSelectedShapeIds([circleInProgress.shapeId]);
        
        return;
      }
    }

    // Regular shape placement for text
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

    addShape(shape);
    setSelectedShapeId(shape.id);
    setSelectedShapeIds([shape.id]);
    setShapeToPlace(null);
    
    setTimeout(() => {
      addToHistory([...shapes, shape]);
    }, 100);
  }, [user, shapeToPlace, addShape, lineInProgress, rectangleInProgress, arrowInProgress, circleInProgress, shapes, addToHistory, setLineInProgress, setRectangleInProgress, setArrowInProgress, setCircleInProgress, setShapeToPlace, setSelectedShapeId, setSelectedShapeIds, setCircleJustFinalized, updateShape]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedShapeIds.length > 0) {
      selectedShapeIds.forEach(id => deleteShape(id));
      setSelectedShapeId(null);
      setSelectedShapeIds([]);
      
      setTimeout(() => {
        const remainingShapes = shapes.filter(s => !selectedShapeIds.includes(s.id));
        addToHistory(remainingShapes);
      }, 100);
    } else if (selectedShapeId) {
      deleteShape(selectedShapeId);
      setSelectedShapeId(null);
      setSelectedShapeIds([]);
      
      setTimeout(() => {
        const remainingShapes = shapes.filter(s => s.id !== selectedShapeId);
        addToHistory(remainingShapes);
      }, 100);
    }
  }, [selectedShapeId, selectedShapeIds, deleteShape, shapes, addToHistory, setSelectedShapeId, setSelectedShapeIds]);

  const handleDuplicate = useCallback(() => {
    if (!user) return;

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
          addShape(newShape);
          newShapeIds.push(newShape.id);
        }
      });
      if (newShapeIds.length > 0) {
        setSelectedShapeId(newShapeIds[0]);
        setSelectedShapeIds(newShapeIds);
        
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
      }
    } else if (selectedShapeId) {
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
        addShape(newShape);
        setSelectedShapeId(newShape.id);
        setSelectedShapeIds([newShape.id]);
        
        setTimeout(() => {
          addToHistory(shapes);
        }, 100);
      }
    }
  }, [selectedShapeId, selectedShapeIds, shapes, user, addShape, addToHistory, setSelectedShapeId, setSelectedShapeIds]);

  const handleAddShape = useCallback((type: ShapeType) => {
    if (!user) return;
    
    // Cancel any shape in progress
    if (lineInProgress) {
      deleteShape(lineInProgress.shapeId);
      setLineInProgress(null);
    }
    if (rectangleInProgress) {
      deleteShape(rectangleInProgress.shapeId);
      setRectangleInProgress(null);
    }
    if (arrowInProgress) {
      deleteShape(arrowInProgress.shapeId);
      setArrowInProgress(null);
    }
    if (circleInProgress) {
      deleteShape(circleInProgress.shapeId);
      setCircleInProgress(null);
    }
    
    // Enter placement mode
    setShapeToPlace(type);
    setSelectedShapeId(null);
    setSelectedShapeIds([]);
    setIsSelectMode(false);
  }, [user, lineInProgress, rectangleInProgress, arrowInProgress, circleInProgress, deleteShape, setLineInProgress, setRectangleInProgress, setArrowInProgress, setCircleInProgress, setShapeToPlace, setSelectedShapeId, setSelectedShapeIds, setIsSelectMode]);

  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode(!isSelectMode);
    
    if (!isSelectMode) {
      setShapeToPlace(null);
      
      if (lineInProgress) {
        deleteShape(lineInProgress.shapeId);
        setLineInProgress(null);
      }
      if (rectangleInProgress) {
        deleteShape(rectangleInProgress.shapeId);
        setRectangleInProgress(null);
      }
      if (arrowInProgress) {
        deleteShape(arrowInProgress.shapeId);
        setArrowInProgress(null);
      }
      if (circleInProgress) {
        deleteShape(circleInProgress.shapeId);
        setCircleInProgress(null);
      }
    }
  }, [isSelectMode, lineInProgress, rectangleInProgress, arrowInProgress, circleInProgress, deleteShape, setIsSelectMode, setShapeToPlace, setLineInProgress, setRectangleInProgress, setArrowInProgress, setCircleInProgress]);

  const handleExitSelectMode = useCallback(() => {
    setIsSelectMode(false);
  }, [setIsSelectMode]);

  return {
    handleAddShape,
    handlePlaceShape,
    handleDeleteSelected,
    handleDuplicate,
    handleToggleSelectMode,
    handleExitSelectMode,
  };
};

