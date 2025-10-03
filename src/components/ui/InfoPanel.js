import React from 'react';

const InfoPanel = ({ errorMessage }) => {
  return (
    <div className="space-y-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Bedienungshinweise
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2 text-xs text-gray-600">
          <p><strong>Punkte setzen:</strong> Klick auf Zeichenfläche</p>
          <p><strong>Längen bearbeiten:</strong> Klick auf grüne Angaben</p>
          <p><strong>Winkel bearbeiten:</strong> Klick auf violette Angaben</p>
          <p><strong>Hauswand setzen:</strong> Hover über Kante + Klick</p>
          <p><strong>Bodenprofile:</strong> Automatisch nach Hauswand-Definition</p>
        </div>
      </div>
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;