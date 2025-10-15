import { useState, useCallback } from 'react';
import Konva from 'konva';
import { Shape } from '../types';

interface UseTextEditingProps {
  shapes: Shape[];
  stageRef: React.RefObject<Konva.Stage>;
  onShapeUpdate: (shape: Shape) => void;
}

export const useTextEditing = ({
  shapes,
  stageRef,
  onShapeUpdate,
}: UseTextEditingProps) => {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textareaValue, setTextareaValue] = useState('');
  const [textareaPosition, setTextareaPosition] = useState({ x: 0, y: 0 });

  // Handle text double-click for editing
  const handleTextDblClick = useCallback((shape: Shape, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;

    // Get the text node to find its absolute position on screen
    const textNode = e.target as Konva.Text;
    const absolutePosition = textNode.getAbsolutePosition();
    
    // Get the stage container position
    const stageBox = stage.container().getBoundingClientRect();
    
    // Get the scale to account for font size in viewport
    const scale = stage.scaleX();
    const fontSize = shape.fontSize || 24;
    
    // Small upward adjustment to align textarea with Konva text
    // Konva renders text slightly higher due to baseline differences
    const verticalAdjustment = fontSize * scale * 0.15;
    
    // Calculate the absolute screen position of the text
    // absolutePosition already accounts for all transformations (scale, position)
    const screenX = stageBox.left + absolutePosition.x;
    const screenY = stageBox.top + absolutePosition.y - verticalAdjustment;
    
    setEditingTextId(shape.id);
    setTextareaValue(shape.text || '');
    setTextareaPosition({ x: screenX, y: screenY });
  }, [stageRef]);

  // Handle text edit complete
  const handleTextEditComplete = useCallback(() => {
    if (!editingTextId) return;

    const shape = shapes.find(s => s.id === editingTextId);
    if (shape && shape.type === 'text') {
      onShapeUpdate({
        ...shape,
        text: textareaValue,
        updatedAt: Date.now(),
      });
    }

    setEditingTextId(null);
    setTextareaValue('');
  }, [editingTextId, textareaValue, shapes, onShapeUpdate]);

  return {
    editingTextId,
    textareaValue,
    textareaPosition,
    setTextareaValue,
    handleTextDblClick,
    handleTextEditComplete,
  };
};

