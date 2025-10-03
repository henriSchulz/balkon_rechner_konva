import React from 'react';
import { pixelsToMeters } from '../../utils/geometry';

const PointsList = ({ points, scale, handleDeletePoint, handleClearAllPoints }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-blue-500">📍</span>
          Punkte ({points.length})
        </h3>
        {points.length > 0 && (
          <button
            onClick={handleClearAllPoints}
            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors duration-200"
            title="Alle Punkte löschen"
          >
            🗑️ Alle
          </button>
        )}
      </div>
      {points.length > 0 ? (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {points.map((point, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
              <div className="flex-1">
                <div className="font-medium text-gray-800">Punkt {index + 1}</div>
                <div className="text-gray-600">
                  x: {pixelsToMeters(point.x, scale)}m, y: {pixelsToMeters(point.y, scale)}m
                </div>
              </div>
              <button
                onClick={() => handleDeletePoint(index)}
                disabled={points.length <= 3}
                className="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs rounded transition-colors duration-200"
                title={points.length <= 3 ? "Mindestens 3 Punkte erforderlich" : "Punkt löschen"}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-500 text-center py-4">Keine Punkte vorhanden</div>
      )}
    </div>
  );
};

export default PointsList;