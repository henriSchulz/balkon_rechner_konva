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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Einstellungen</h2>
      <div className="space-y-4">
        {/* <div>
          <label htmlFor="scale-slider" className="block text-sm font-medium text-gray-700">
            Maßstab
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input
              id="scale-slider"
              type="range"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              min="10"
              max="200"
              step="5"
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <input
              type="number"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              min="10"
              max="200"
              step="5"
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-accent/80 focus:border-transparent"
            />
          </div>
        </div> */}

        <div className="space-y-2">
           <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={showLengths}
              onChange={(e) => setShowLengths(e.target.checked)}
              className="w-4 h-4 text-accent bg-gray-100 border-gray-300 rounded focus:ring-accent focus:ring-2"
            />
            Längen anzeigen
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
              className="w-4 h-4 text-accent bg-gray-100 border-gray-300 rounded focus:ring-accent focus:ring-2"
            />
            Fang-Funktion
          </label>
           <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={showProfiles}
              onChange={(e) => setShowProfiles(e.target.checked)}
              className="w-4 h-4 text-accent bg-gray-100 border-gray-300 rounded focus:ring-accent focus:ring-2"
            />
            Bodenprofile anzeigen
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => setLockedEdges(new Set())}
            disabled={lockedEdges.size === 0}
            className="w-full px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
          >
            Kanten entsperren ({lockedEdges.size})
          </button>
          {/* <button
            onClick={() => setLockedAngles(new Set())}
            disabled={lockedAngles.size === 0}
            className="w-full px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
          >
            Winkel entsperren ({lockedAngles.size})
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;