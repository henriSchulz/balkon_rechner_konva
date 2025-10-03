import React from 'react';

const ResultsPanel = ({ polygonArea }) => {
  if (polygonArea === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-green-500">📊</span>
        Ergebnisse
      </h2>
      <div className="w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 flex items-center gap-3">
        <span className="text-blue-600 text-lg">📐</span>
        <div>
          <h3 className="text-xs font-medium text-blue-800">Fläche</h3>
          <p className="text-lg font-bold text-blue-900">{polygonArea.toFixed(2)} m²</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;