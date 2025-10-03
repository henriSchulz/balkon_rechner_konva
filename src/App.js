import React from 'react';
import CanvasComponent from './CanvasComponent';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏗️ Balkon Rechner
          </h1>
          <p className="text-gray-600 text-lg">
            Präzise Vermessung und Planung für Ihren Balkon
          </p>
        </div>
        <CanvasComponent />
      </div>
    </div>
  );
}

export default App;