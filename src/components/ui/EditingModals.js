import React from 'react';

const EditingModals = ({
  editingEdge,
  editingLength,
  setEditingLength,
  handleLengthChange,
  handleLengthCancel,
  editingAngle,
  editingAngleValue,
  setEditingAngleValue,
  handleAngleChange,
  handleAngleCancel,
}) => {
  if (editingEdge === null && editingAngle === null) return null;

  return (
    <>
      {editingEdge !== null && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-green-500 rounded-lg p-4 shadow-2xl z-50">
          <div className="mb-3 font-semibold text-gray-800 text-sm">
            Neue Länge eingeben:
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editingLength}
              onChange={(e) => setEditingLength(e.target.value)}
              step="0.1"
              min="0.1"
              className="w-18 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleLengthChange(editingLength);
                else if (e.key === 'Escape') handleLengthCancel();
              }}
            />
            <span className="text-gray-600 text-sm">m</span>
            <button
              onClick={() => handleLengthChange(editingLength)}
              className="px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              OK
            </button>
            <button
              onClick={handleLengthCancel}
              className="px-2 py-1.5 bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {editingAngle !== null && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-purple-500 rounded-lg p-4 shadow-2xl z-50">
          <div className="mb-3 font-semibold text-gray-800 text-sm">
            Neuen Winkel eingeben:
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editingAngleValue}
              onChange={(e) => setEditingAngleValue(e.target.value)}
              step="1"
              min="1"
              max="179"
              className="w-18 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAngleChange(editingAngleValue);
                else if (e.key === 'Escape') handleAngleCancel();
              }}
            />
            <span className="text-gray-600 text-sm">°</span>
            <button
              onClick={() => handleAngleChange(editingAngleValue)}
              className="px-2 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              OK
            </button>
            <button
              onClick={handleAngleCancel}
              className="px-2 py-1.5 bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium rounded-md transition-colors duration-200"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EditingModals;