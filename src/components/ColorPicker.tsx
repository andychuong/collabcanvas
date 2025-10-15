import React, { useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
  };

  return (
    <div className="relative">
      <div className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <div
            className="w-5 h-5 rounded border border-gray-300"
            style={{ backgroundColor: color }}
          />
          <Palette className="w-4 h-4" />
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
          Change Color
        </div>
      </div>

      {isOpen && (
        <>
          {/* Backdrop to close picker */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Color Picker Popup */}
          <div className="absolute top-full left-0 mt-2 z-40">
            <SketchPicker
              color={color}
              onChange={handleChange}
              disableAlpha={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

