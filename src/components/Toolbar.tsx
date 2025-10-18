import React from 'react';
import { Square, Circle, Type, Trash2, LogOut, Minus, Undo2, Redo2, Copy, MousePointer2, Plus, Bold, Italic, Underline, RotateCcw, RotateCw, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, ArrowRight } from 'lucide-react';
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
  onFontSizeChange?: (size: number) => void;
  onFontFamilyChange?: (fontFamily: string) => void;
  onFontWeightChange?: (fontWeight: 'normal' | 'bold') => void;
  onFontStyleChange?: (fontStyle: 'normal' | 'italic') => void;
  onTextDecorationChange?: (textDecoration: 'none' | 'underline') => void;
  onPositionChange?: (x: number, y: number) => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  groupName?: string;
}

// Helper function to get initials from a name
const getInitials = (name: string | undefined): string => {
  if (!name || typeof name !== 'string') {
    return '??';
  }
  const trimmedName = name.trim();
  if (!trimmedName) {
    return '??';
  }
  const words = trimmedName.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return trimmedName.slice(0, 2).toUpperCase();
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
  onFontSizeChange,
  onFontFamilyChange,
  onFontWeightChange,
  onFontStyleChange,
  onTextDecorationChange,
  onPositionChange,
  onRotateLeft,
  onRotateRight,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  isSelectMode,
  onToggleSelectMode,
  groupName,
}) => {
  const hasSelection = selectedShapeIds.length > 0;
  
  // Get the selected shape's color
  const selectedShape = hasSelection && selectedShapeIds.length === 1 
    ? shapes.find(s => s.id === selectedShapeIds[0])
    : null;
  
  // For stroke-based shapes (line, rectangle, circle, arrow), show stroke color
  // For text, show fill color
  const currentStrokeColor = selectedShape?.type === 'line' || selectedShape?.type === 'rectangle' || selectedShape?.type === 'circle' || selectedShape?.type === 'arrow'
    ? selectedShape.stroke || '#000000'
    : selectedShape?.fill || '#000000';
  
  // Get fill color for rectangles, circles, and arrows
  const currentFillColor = selectedShape?.fill || 'transparent';
  
  // Check if selected shape is a rectangle, circle, or arrow (shapes that can have both stroke and fill)
  const canHaveFill = selectedShape?.type === 'rectangle' || selectedShape?.type === 'circle' || selectedShape?.type === 'arrow';
  
  // Show max 10 users, then show "+N" for additional users
  const maxVisibleUsers = 10;
  
  // Separate current user from other users
  const currentUser = onlineUsers.find(user => user.id === currentUserId);
  const otherUsers = onlineUsers.filter(user => user.id !== currentUserId);
  
  // Take up to maxVisibleUsers-1 other users (to leave room for current user)
  const visibleOtherUsers = otherUsers.slice(0, maxVisibleUsers - 1);
  const additionalUsersCount = Math.max(0, otherUsers.length - visibleOtherUsers.length);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10" style={{
      borderBottom: '2px solid #9ca3af',
      background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 80%, #e5e7eb 100%)'
    }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800 mr-2">CollabCanvas</h1>
          
          {/* Group Badge */}
          {groupName && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-semibold">{groupName}</span>
            </div>
          )}
          
          <div className="flex gap-2 ml-2">
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
                onClick={() => onAddShape('arrow')}
                className="flex items-center justify-center p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Arrow
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
                className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Undo (Ctrl+Z)
              </div>
            </div>
            
            <div className="relative group">
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo2 className="w-5 h-5" />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Redo (Ctrl+Y)
              </div>
            </div>

            {hasSelection && (
              <>
                {/* Divider */}
                <div className="h-8 w-px bg-gray-300"></div>
              
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

                {/* Font Size Controls (only for text) */}
                {selectedShapeIds.length === 1 && selectedShape?.type === 'text' && onFontSizeChange && (
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                    <button
                      onClick={() => {
                        const currentSize = selectedShape.fontSize || 24;
                        onFontSizeChange(Math.max(8, currentSize - 2));
                      }}
                      className="flex items-center justify-center w-6 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      title="Decrease font size"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={selectedShape.fontSize || 24}
                      onChange={(e) => {
                        const size = parseInt(e.target.value, 10);
                        if (!isNaN(size) && size >= 8 && size <= 200) {
                          onFontSizeChange(size);
                        }
                      }}
                      className="w-12 h-8 text-center text-sm border-none bg-transparent focus:outline-none"
                      min="8"
                      max="200"
                    />
                    <button
                      onClick={() => {
                        const currentSize = selectedShape.fontSize || 24;
                        onFontSizeChange(Math.min(200, currentSize + 2));
                      }}
                      className="flex items-center justify-center w-6 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      title="Increase font size"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Font Family Dropdown (only for text) */}
                {selectedShapeIds.length === 1 && selectedShape?.type === 'text' && onFontFamilyChange && (
                  <select
                    value={selectedShape.fontFamily || 'Arial'}
                    onChange={(e) => onFontFamilyChange(e.target.value)}
                    className="h-10 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Font family"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Impact">Impact</option>
                  </select>
                )}

                {/* Text Formatting Buttons (only for text) */}
                {selectedShapeIds.length === 1 && selectedShape?.type === 'text' && (
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                    {onFontWeightChange && (
                      <button
                        onClick={() => {
                          const currentWeight = selectedShape.fontWeight || 'normal';
                          onFontWeightChange(currentWeight === 'bold' ? 'normal' : 'bold');
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
                          selectedShape.fontWeight === 'bold' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                    )}
                    {onFontStyleChange && (
                      <button
                        onClick={() => {
                          const currentStyle = selectedShape.fontStyle || 'normal';
                          onFontStyleChange(currentStyle === 'italic' ? 'normal' : 'italic');
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
                          selectedShape.fontStyle === 'italic' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                    )}
                    {onTextDecorationChange && (
                      <button
                        onClick={() => {
                          const currentDecoration = selectedShape.textDecoration || 'none';
                          onTextDecorationChange(currentDecoration === 'underline' ? 'none' : 'underline');
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
                          selectedShape.textDecoration === 'underline' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Underline"
                      >
                        <Underline className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Position Controls (X and Y) */}
                {selectedShapeIds.length === 1 && selectedShape && onPositionChange && (
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600 font-medium">X:</span>
                      <input
                        type="number"
                        value={Math.round(selectedShape.x)}
                        onChange={(e) => {
                          const x = parseInt(e.target.value, 10);
                          if (!isNaN(x)) {
                            onPositionChange(x, selectedShape.y);
                          }
                        }}
                        className="w-16 h-8 text-center text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
                        title="X position"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600 font-medium">Y:</span>
                      <input
                        type="number"
                        value={Math.round(selectedShape.y)}
                        onChange={(e) => {
                          const y = parseInt(e.target.value, 10);
                          if (!isNaN(y)) {
                            onPositionChange(selectedShape.x, y);
                          }
                        }}
                        className="w-16 h-8 text-center text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
                        title="Y position"
                      />
                    </div>
                  </div>
                )}

                {/* Rotation Controls (only for rectangles and arrows) */}
                {selectedShapeIds.length === 1 && (selectedShape?.type === 'rectangle' || selectedShape?.type === 'arrow') && (
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                    {onRotateLeft && (
                      <div className="relative group">
                        <button
                          onClick={onRotateLeft}
                          className="flex items-center justify-center w-8 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Rotate Left 90°"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Rotate Left 90°
                        </div>
                      </div>
                    )}
                    {onRotateRight && (
                      <div className="relative group">
                        <button
                          onClick={onRotateRight}
                          className="flex items-center justify-center w-8 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Rotate Right 90°"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Rotate Right 90°
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Divider */}
                {selectedShapeIds.length === 1 && (
                  <div className="h-8 w-px bg-gray-300"></div>
                )}

                {/* Layer Controls */}
                {selectedShapeIds.length === 1 && (
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                    {onBringToFront && (
                      <div className="relative group">
                        <button
                          onClick={onBringToFront}
                          className="flex items-center justify-center w-8 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Bring to Front"
                        >
                          <ChevronsUp className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Bring to Front
                        </div>
                      </div>
                    )}
                    {onBringForward && (
                      <div className="relative group">
                        <button
                          onClick={onBringForward}
                          className="flex items-center justify-center w-8 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Bring Forward"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Bring Forward
                        </div>
                      </div>
                    )}
                    {onSendBackward && (
                      <div className="relative group">
                        <button
                          onClick={onSendBackward}
                          className="flex items-center justify-center w-8 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Send Backward"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Send Backward
                        </div>
                      </div>
                    )}
                    {onSendToBack && (
                      <div className="relative group">
                        <button
                          onClick={onSendToBack}
                          className="flex items-center justify-center w-8 h-8 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Send to Back"
                        >
                          <ChevronsDown className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          Send to Back
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div className="h-8 w-px bg-gray-300"></div>
                
                <div className="relative group">
                  <button
                    onClick={onDuplicate}
                    className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    Duplicate (Ctrl+D)
                  </div>
                </div>
                
                <div className="relative group">
                  <button
                    onClick={onDeleteSelected}
                    className="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
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
          <div className="flex items-center">
            {/* Other users with overlap */}
            {visibleOtherUsers.length > 0 && (
              <div className="flex items-center -space-x-2">
                {visibleOtherUsers.map((user) => (
                  <div
                    key={user.id}
                    className="relative group"
                    title={user.name}
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
            )}
            
            {/* Current user (logged in) - separated with spacing */}
            {currentUser && (
              <div
                className={`relative group ${visibleOtherUsers.length > 0 ? 'ml-2' : ''}`}
                title={`${currentUser.name} (you)`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-black text-xs font-semibold shadow-md border-2 border-gray-400 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {getInitials(currentUser.name)}
                </div>
                {/* Tooltip on hover - shown below the bubble */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  {currentUser.name} (you)
                </div>
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

