import { useCallback } from 'react';
import { Shape } from '../types';

interface UseStyleHandlersProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  selectedShapeIds: string[];
  handleShapeUpdate: (shape: Shape, immediate?: boolean) => void;
}

export const useStyleHandlers = ({
  shapes,
  selectedShapeId,
  selectedShapeIds,
  handleShapeUpdate,
}: UseStyleHandlersProps) => {
  
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

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleFontSizeChange = useCallback((size: number) => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontSize: size,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleFontFamilyChange = useCallback((fontFamily: string) => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontFamily,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleFontWeightChange = useCallback((fontWeight: 'normal' | 'bold') => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontWeight,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleFontStyleChange = useCallback((fontStyle: 'normal' | 'italic') => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      fontStyle,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleTextDecorationChange = useCallback((textDecoration: 'none' | 'underline') => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'text') return;

    const updatedShape: Shape = {
      ...shape,
      textDecoration,
      updatedAt: Date.now(),
    };

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

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  return {
    handleColorChange,
    handleFillColorChange,
    handleFontSizeChange,
    handleFontFamilyChange,
    handleFontWeightChange,
    handleFontStyleChange,
    handleTextDecorationChange,
    handlePositionChange,
  };
};

