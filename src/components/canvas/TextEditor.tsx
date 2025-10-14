import React from 'react';
import { Shape, ViewportState } from '../../types';

interface TextEditorProps {
  editingTextId: string | null;
  textareaValue: string;
  textareaPosition: { x: number; y: number };
  shapes: Shape[];
  viewport: ViewportState;
  onTextareaChange: (value: string) => void;
  onTextEditComplete: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  editingTextId,
  textareaValue,
  textareaPosition,
  shapes,
  viewport,
  onTextareaChange,
  onTextEditComplete,
}) => {
  if (!editingTextId) return null;

  const editingShape = shapes.find(s => s.id === editingTextId);

  return (
    <textarea
      value={textareaValue}
      onChange={(e) => onTextareaChange(e.target.value)}
      onBlur={onTextEditComplete}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          onTextEditComplete();
        }
      }}
      autoFocus
      style={{
        position: 'fixed',
        top: `${textareaPosition.y}px`,
        left: `${textareaPosition.x}px`,
        fontSize: `${(editingShape?.fontSize || 24) * viewport.scale}px`,
        border: 'none',
        outline: '1px solid #9CA3AF',
        padding: '2px',
        background: 'transparent',
        resize: 'none',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.2',
        color: editingShape?.fill || '#000000',
        caretColor: '#000000',
        zIndex: 1000,
        minWidth: '100px',
      }}
    />
  );
};

