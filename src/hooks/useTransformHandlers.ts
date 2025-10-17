import { useCallback } from 'react';
import { Shape } from '../types';

interface UseTransformHandlersProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  selectedShapeIds: string[];
  handleShapeUpdate: (shape: Shape, immediate?: boolean) => void;
}

export const useTransformHandlers = ({
  shapes,
  selectedShapeId,
  selectedShapeIds,
  handleShapeUpdate,
}: UseTransformHandlersProps) => {
  
  const handleRotateLeft = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'rectangle') return;

    const currentRotation = shape.rotation || 0;
    const updatedShape: Shape = {
      ...shape,
      rotation: currentRotation - 90,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleRotateRight = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape || shape.type !== 'rectangle') return;

    const currentRotation = shape.rotation || 0;
    const updatedShape: Shape = {
      ...shape,
      rotation: currentRotation + 90,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleBringToFront = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

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

    const updatedShape: Shape = {
      ...shape,
      zIndex: (shape.zIndex || 0) + 1,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  const handleSendBackward = useCallback(() => {
    const id = selectedShapeIds.length === 1 ? selectedShapeIds[0] : selectedShapeId;
    if (!id) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const updatedShape: Shape = {
      ...shape,
      zIndex: (shape.zIndex || 0) - 1,
      updatedAt: Date.now(),
    };

    handleShapeUpdate(updatedShape, true);
  }, [selectedShapeId, selectedShapeIds, shapes, handleShapeUpdate]);

  return {
    handleRotateLeft,
    handleRotateRight,
    handleBringToFront,
    handleSendToBack,
    handleBringForward,
    handleSendBackward,
  };
};

