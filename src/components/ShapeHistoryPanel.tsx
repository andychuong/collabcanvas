import React from 'react';
import { ShapeHistoryEntry } from '../types';
import { Clock, User, RotateCcw, XCircle } from 'lucide-react';

interface ShapeHistoryPanelProps {
  shapeId: string | null;
  historyEntries: ShapeHistoryEntry[];
  loading: boolean;
  onRestore: (entry: ShapeHistoryEntry) => void;
  onClose: () => void;
}

export const ShapeHistoryPanel: React.FC<ShapeHistoryPanelProps> = ({
  shapeId,
  historyEntries,
  loading,
  onRestore,
  onClose,
}) => {
  if (!shapeId) {
    return null;
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '✨';
      case 'transformed':
        return '↔️';
      case 'styled':
        return '🎨';
      default:
        return '✏️';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Created';
      case 'transformed':
        return 'Moved/Resized';
      case 'styled':
        return 'Styled';
      default:
        return 'Updated';
    }
  };

  const getChangeDescription = (entry: ShapeHistoryEntry): string => {
    if (entry.description) return entry.description;
    
    const shape = entry.snapshot;
    const details: string[] = [];
    
    if (entry.action === 'created') {
      details.push(`Created ${shape.type}`);
    } else if (entry.action === 'transformed') {
      details.push(`Position: (${Math.round(shape.x)}, ${Math.round(shape.y)})`);
      if (shape.width) details.push(`Size: ${Math.round(shape.width)}×${Math.round(shape.height || 0)}`);
      if (shape.radius) details.push(`Radius: ${Math.round(shape.radius)}`);
    } else if (entry.action === 'styled') {
      if (shape.fill) details.push(`Fill: ${shape.fill}`);
      if (shape.stroke) details.push(`Stroke: ${shape.stroke}`);
    }
    
    return details.join(', ') || 'Modified shape';
  };

  return (
    <div className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-800">Shape History</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white rounded-full transition-colors"
          title="Close history"
        >
          <XCircle className="w-5 h-5 text-gray-500 hover:text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-2"></div>
            Loading history...
          </div>
        ) : historyEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No history available</p>
            <p className="text-sm mt-1">Changes will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={`bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all ${
                  index === 0 ? 'ring-2 ring-indigo-100' : ''
                }`}
              >
                {/* Action and timestamp */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" title={getActionLabel(entry.action)}>
                      {getActionIcon(entry.action)}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {getActionLabel(entry.action)}
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-600">
                  <User className="w-3 h-3" />
                  <span>{entry.userName || 'Unknown user'}</span>
                </div>

                {/* Change details */}
                <div className="text-xs text-gray-600 mb-3 bg-white p-2 rounded border border-gray-100">
                  {getChangeDescription(entry)}
                </div>

                {/* Restore button - don't show for current version */}
                {index !== 0 && (
                  <button
                    onClick={() => onRestore(entry)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-3 rounded transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore this version
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
        {historyEntries.length > 0 && (
          <p>Showing {historyEntries.length} version{historyEntries.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
};

