import React, { useState } from 'react';
import { Heart, HelpCircle, X } from 'lucide-react';

export const Footer: React.FC = React.memo(() => {
  const currentYear = new Date().getFullYear();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm z-10">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            {/* Left side - Made with love */}
            <div className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for collaboration
            </div>

            {/* Right side - Help button */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1 hover:text-gray-800 transition-colors px-2 py-1 rounded hover:bg-gray-100"
              title="Help & Shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Help & Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">🎨 Drawing Shapes</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">➕ Add Basic Shapes (Circle/Text)</div>
                    <div>Click the shape button in the toolbar (top), then click anywhere on the canvas to place it. The shape will appear at your click location.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">📏 Draw a Line</div>
                    <div>Click the Line button, then click to place the first anchor point. Move your mouse (you'll see a preview), then click again to place the second anchor. The line is now created and can be moved or resized.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">▭ Draw a Rectangle</div>
                    <div>Click the Rectangle button, then click to set the first corner. Move your mouse (you'll see the rectangle grow), then click to set the opposite corner. Perfect for creating boxes and frames.</div>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">✏️ Editing Shapes</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🔗 Resize a Line</div>
                    <div>Click to select the line. Two circular handles will appear at each end. Drag either handle to change the line's length and direction. The other end stays anchored in place.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">⬚ Resize a Rectangle</div>
                    <div>Select the rectangle to reveal four corner handles. Drag any corner to resize. The opposite corner stays fixed, allowing you to stretch or shrink from any direction.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">⚪ Resize a Circle</div>
                    <div>Select the circle to see four handles on its edges (top, right, bottom, left). Drag any handle away from or toward the center to grow or shrink the circle. The handles stay on the perimeter.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">✋ Move Shapes</div>
                    <div>Click and drag any shape to move it around the canvas. If multiple shapes are selected, they'll all move together maintaining their relative positions.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">✏️ Edit Text</div>
                    <div>Double-click any text shape to enter edit mode. A text input will appear where you can type. Press Enter or click outside to save changes. Press Escape to cancel.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🎨 Change Colors</div>
                    <div>Select a shape, then use the color pickers in the toolbar. Rectangles and circles have two pickers: one for border (outline) and one for fill. Lines and text have a single color picker.</div>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">🗺️ Canvas Navigation</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🖱️ Pan the Canvas</div>
                    <div>Click and drag on any empty area to pan around. You can also use the middle mouse button (scroll wheel click) from anywhere. This is perfect for exploring large canvases.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🔍 Zoom In/Out</div>
                    <div>Use your mouse wheel to zoom. Scroll up to zoom in (see details), scroll down to zoom out (see more). On trackpads, use pinch gestures. The zoom centers around your cursor position.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🏠 Reset Viewport</div>
                    <div>Press Spacebar to instantly return to the default view (50% zoom, centered). Useful when you get lost or want to see the full canvas quickly.</div>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">🎯 Selection Tools</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🎯 Select a Single Shape</div>
                    <div>Simply click on any shape to select it. Selected shapes show handles and a visual highlight. Only one shape can be selected at a time unless using multi-select.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🔘 Select Mode (V key)</div>
                    <div>Press V or click the Select button to enter select mode. In this mode, clicking won't drag shapes - it only selects them. Great for quickly selecting without accidentally moving things. Exits automatically after selecting.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">📦 Multi-Select Shapes</div>
                    <div>Method 1: Enter select mode (V key) and drag a box around multiple shapes. Method 2: Hold Ctrl (Windows) or Cmd (Mac) and click individual shapes to add them to selection. Selected shapes can be moved, deleted, or duplicated together.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">⎋ Deselect All</div>
                    <div>Press Escape or click on empty canvas space to deselect everything. Also useful for canceling ongoing operations like line or rectangle drawing.</div>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">⌨️ Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="space-y-2">
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl/Cmd + Z</kbd> <span className="ml-2">Undo last action</span></div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl/Cmd + Y</kbd> <span className="ml-2">Redo last action</span></div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Delete</kbd> <span className="ml-2">Delete selected shapes</span></div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl/Cmd + D</kbd> <span className="ml-2">Duplicate selection</span></div>
                  </div>
                  <div className="space-y-2">
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">V</kbd> <span className="ml-2">Toggle select mode</span></div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Spacebar</kbd> <span className="ml-2">Reset viewport</span></div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Escape</kbd> <span className="ml-2">Cancel/Deselect</span></div>
                    <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl/Cmd</kbd> <span className="ml-2">Multi-select mode</span></div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">👥 Collaboration Features</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">👁️ Real-Time Cursors</div>
                    <div>See where other users are pointing in real-time. Each user has a unique colored cursor with their name displayed. Perfect for pair programming or design reviews.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">🔄 Automatic Sync</div>
                    <div>All changes sync automatically across all connected users. Create, move, resize, or delete shapes and everyone sees updates instantly. No manual save or refresh needed.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">⏱️ Conflict Resolution</div>
                    <div>When multiple users edit the same shape simultaneously, the last person to finish their edit wins (timestamp-based). This prevents data loss while maintaining a simple, predictable system.</div>
                  </li>
                  <li className="pl-4">
                    <div className="font-semibold text-gray-700 mb-1">👤 Online Users</div>
                    <div>See all currently connected users in the top-right toolbar. Each user has a colored badge with their initials. Hover to see full names.</div>
                  </li>
                </ul>
              </section>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
              CollabCanvas {currentYear} - Real-time Collaborative Canvas
            </div>
          </div>
        </div>
      )}
    </>
  );
});

