import React, { useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  outline?: boolean; // If true, shows color as border instead of fill
  tooltipText?: string; // Custom tooltip text
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, outline = false, tooltipText = 'Change Color' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (colorResult: ColorResult) => {
    // Use rgba if alpha is less than 1, otherwise use hex
    if (colorResult.rgb.a !== undefined && colorResult.rgb.a < 1) {
      onChange(`rgba(${colorResult.rgb.r}, ${colorResult.rgb.g}, ${colorResult.rgb.b}, ${colorResult.rgb.a})`);
    } else {
      onChange(colorResult.hex);
    }
  };

  return (
    <div className="relative">
      <div className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors relative"
        >
          <div
            className="w-6 h-6 rounded border-2"
            style={outline 
              ? { backgroundColor: 'white', borderColor: color }
              : { backgroundColor: color, borderColor: '#d1d5db' }
            }
          />
          <Palette className="w-3 h-3 absolute bottom-0 right-0 bg-gray-100 rounded-full" style={{ padding: '1px' }} />
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
          {tooltipText}
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

