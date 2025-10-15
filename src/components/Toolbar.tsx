import React from 'react';
import { Square, Circle, Type, Trash2, LogOut, Minus, Undo2, Redo2, Copy, MousePointer2 } from 'lucide-react';
import { ShapeType, User as UserType, Shape } from '../types';
import { ColorPicker } from './ColorPicker';

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
  currentUserId: string;
  onlineUsers: UserType[];
  shapes: Shape[];
  onColorChange?: (color: string) => void;
  onFillColorChange?: (color: string) => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
}

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const Toolbar: React.FC<ToolbarProps> = React.memo(({
  onAddShape,
  onDeleteSelected,
  onDuplicate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onLogout,
  selectedShapeIds,
  currentUserId,
  onlineUsers,
  shapes,
  onColorChange,
  onFillColorChange,
  isSelectMode,
  onToggleSelectMode,
}) => {
  const hasSelection = selectedShapeIds.length > 0;
  
  // Get the selected shape's color
  const selectedShape = hasSelection && selectedShapeIds.length === 1 
    ? shapes.find(s => s.id === selectedShapeIds[0])
    : null;
  
  // For stroke-based shapes (line, rectangle, circle), show stroke color
  // For text, show fill color
  const currentStrokeColor = selectedShape?.type === 'line' || selectedShape?.type === 'rectangle' || selectedShape?.type === 'circle'
    ? selectedShape.stroke || '#000000'
    : selectedShape?.fill || '#000000';
  
  // Get fill color for rectangles and circles
  const currentFillColor = selectedShape?.fill || 'transparent';
  
  // Check if selected shape is a rectangle or circle (shapes that can have both stroke and fill)
  const canHaveFill = selectedShape?.type === 'rectangle' || selectedShape?.type === 'circle';
  
  // Show max 10 users, then show "+N" for additional users
  const maxVisibleUsers = 10;
  const visibleUsers = onlineUsers.slice(0, maxVisibleUsers);
  const additionalUsersCount = Math.max(0, onlineUsers.length - maxVisibleUsers);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800 mr-4">CollabCanvas</h1>
          
          <div className="flex gap-2">
            {/* Select Mode Tool */}
            <div className="relative group">
              <button
                onClick={onToggleSelectMode}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                  isSelectMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-700 text-white hover:bg-gray-800'
                }`}
              >
                <MousePointer2 className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Select Mode (V)
              </div>
            </div>
            
            {/* Shape Tools */}
            <div className="relative group">
              <button
                onClick={() => onAddShape('rectangle')}
                className="flex items-center justify-center p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Rectangle
              </div>
            </div>
            
            <div className="relative group">
              <button
                onClick={() => onAddShape('circle')}
                className="flex items-center justify-center p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Circle className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Circle
              </div>
            </div>
            
            <div className="relative group">
              <button
                onClick={() => onAddShape('line')}
                className="flex items-center justify-center p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Line
              </div>
            </div>
            
            <div className="relative group">
              <button
                onClick={() => onAddShape('text')}
                className="flex items-center justify-center p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Type className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Text
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-300 mx-1" />

            {/* Edit Tools */}
            <div className="relative group">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Undo (Ctrl+Z)
              </div>
            </div>
            
            <div className="relative group">
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Redo (Ctrl+Y)
              </div>
            </div>

            {hasSelection && (
              <>
                {selectedShapeIds.length === 1 && onColorChange && (
                  <>
                    {/* Stroke Color Picker - shown as outline for shapes with fill */}
                    <ColorPicker
                      color={currentStrokeColor}
                      onChange={onColorChange}
                      outline={canHaveFill}
                      tooltipText={canHaveFill ? 'Border Color' : 'Change Color'}
                    />
                    
                    {/* Fill Color Picker (only for rectangles and circles) */}
                    {canHaveFill && onFillColorChange && (
                      <ColorPicker
                        color={currentFillColor}
                        onChange={onFillColorChange}
                        tooltipText="Fill Color"
                      />
                    )}
                  </>
                )}
                
                <div className="relative group">
                  <button
                    onClick={onDuplicate}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    Duplicate (Ctrl+D)
                  </div>
                </div>
                
                <div className="relative group">
                  <button
                    onClick={onDeleteSelected}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    Delete (Del)
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User Bubbles */}
          <div className="flex items-center -space-x-2">
            {visibleUsers.map((user) => (
              <div
                key={user.id}
                className="relative group"
                title={user.id === currentUserId ? `${user.name} (you)` : user.name}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-black text-xs font-semibold shadow-md border-2 border-gray-400 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: user.color }}
                >
                  {getInitials(user.name)}
                </div>
                {/* Tooltip on hover - shown below the bubble */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  {user.name}
                  {user.id === currentUserId && ' (you)'}
                </div>
              </div>
            ))}
            {additionalUsersCount > 0 && (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-400 text-white text-xs font-semibold shadow-md border-2 border-gray-400"
                title={`${additionalUsersCount} more user${additionalUsersCount > 1 ? 's' : ''} online`}
              >
                +{additionalUsersCount}
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 sm:hidden">
              Logout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

