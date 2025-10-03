import React from 'react';

const SettingsPanel = ({
  scale,
  setScale,
  showLengths,
  setShowLengths,
  snapEnabled,
  setSnapEnabled,
  showProfiles,
  setShowProfiles,
  lockedEdges,
  setLockedEdges,
  lockedAngles,
  setLockedAngles,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-blue-500">⚙️</span>
        Einstellungen
      </h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Maßstab (Pixel pro Meter)</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="range"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              min="10"
              max="200"
              step="5"
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <input
              type="number"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              min="10"
              max="200"
              step="5"
              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={showLengths}
              onChange={(e) => setShowLengths(e.target.checked)}
              className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            Längen anzeigen
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
              className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            Snap aktiviert
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
          <input
            type="checkbox"
            checked={showProfiles}
            onChange={(e) => setShowProfiles(e.target.checked)}
            className="w-3 h-3 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
          />
          Bodenprofile anzeigen
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLockedEdges(new Set())}
            disabled={lockedEdges.size === 0}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors duration-200"
          >
            <span>🔓</span> Kanten ({lockedEdges.size})
          </button>
          <button
            onClick={() => setLockedAngles(new Set())}
            disabled={lockedAngles.size === 0}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors duration-200"
          >
            <span>🔓</span> Winkel ({lockedAngles.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;