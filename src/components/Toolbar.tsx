import React from 'react';
import { Square, Circle, Type, Trash2, LogOut, Minus, Undo2, Redo2, Copy } from 'lucide-react';
import { ShapeType } from '../types';

interface ToolbarProps {
  onAddShape: (type: ShapeType) => void;
  onDeleteSelected: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onLogout: () => void;
  selectedShapeIds: string[];
  currentUser: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddShape,
  onDeleteSelected,
  onDuplicate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onLogout,
  selectedShapeIds,
  currentUser,
}) => {
  const hasSelection = selectedShapeIds.length > 0;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800 mr-4">CollabCanvas</h1>
          
          <div className="flex gap-2">
            {/* Shape Tools */}
            <button
              onClick={() => onAddShape('rectangle')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Add Rectangle"
            >
              <Square className="w-4 h-4" />
              <span className="hidden sm:inline">Rectangle</span>
            </button>
            
            <button
              onClick={() => onAddShape('circle')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Add Circle"
            >
              <Circle className="w-4 h-4" />
              <span className="hidden sm:inline">Circle</span>
            </button>
            
            <button
              onClick={() => onAddShape('line')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Add Line"
            >
              <Minus className="w-4 h-4" />
              <span className="hidden sm:inline">Line</span>
            </button>
            
            <button
              onClick={() => onAddShape('text')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Add Text"
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Text</span>
            </button>

            {/* Divider */}
            <div className="w-px bg-gray-300 mx-1" />

            {/* Edit Tools */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            {hasSelection && (
              <>
                <button
                  onClick={onDuplicate}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Duplicate (Ctrl+D)"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <button
                  onClick={onDeleteSelected}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Delete (Del)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 hidden md:block">
            <span className="font-medium">{currentUser}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

