import React from 'react';

const InfoPanel = ({ errorMessage }) => {
  return (
    <div className="mb-4 space-y-2">
      <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg shadow-md border border-blue-200 p-3">
        <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <span>💡</span>
          Bedienungshinweise
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-blue-700">
          <p><strong>Punkte setzen:</strong> Klick auf Zeichenfläche</p>
          <p><strong>Längen bearbeiten:</strong> Klick auf grüne Angaben</p>
          <p><strong>Winkel bearbeiten:</strong> Klick auf violette Angaben</p>
          <p><strong>Hauswand setzen:</strong> Hover über Kante + Klick</p>
          <p><strong>Bodenprofile:</strong> Automatisch nach Hauswand-Definition</p>
        </div>
      </div>
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 text-sm font-medium">{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;