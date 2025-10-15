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
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const hasInitialized = React.useRef(false);

  // Focus and select only when first opening the editor
  React.useEffect(() => {
    if (editingTextId && textareaRef.current && !hasInitialized.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      hasInitialized.current = true;
    }
    
    // Reset when closing
    if (!editingTextId) {
      hasInitialized.current = false;
    }
  }, [editingTextId]);

  // Auto-resize on text change
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.style.width = 'auto';
      textareaRef.current.style.width = Math.max(100, textareaRef.current.scrollWidth + 2) + 'px';
    }
  }, [textareaValue]);

  return (
    <textarea
      ref={textareaRef}
      value={textareaValue}
      onChange={(e) => onTextareaChange(e.target.value)}
      onBlur={onTextEditComplete}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onTextEditComplete();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onTextEditComplete();
        }
      }}
      style={{
        position: 'fixed',
        top: `${textareaPosition.y}px`,
        left: `${textareaPosition.x}px`,
        fontSize: `${(editingShape?.fontSize || 24) * viewport.scale}px`,
        border: 'none',
        outline: 'none',
        padding: '0px',
        margin: '0px',
        background: 'transparent',
        resize: 'none',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
        lineHeight: 'normal',
        color: editingShape?.fill || '#000000',
        caretColor: editingShape?.fill || '#000000',
        zIndex: 1000,
        minWidth: '100px',
        whiteSpace: 'pre',
        verticalAlign: 'baseline',
        transform: 'translateY(0)',
      }}
    />
  );
};

