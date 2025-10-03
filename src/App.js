import React from 'react';
import BalkonRechnerPage from './components/BalkonRechnerPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Balkonrechner</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BalkonRechnerPage />
      </main>
    </div>
  );
}

export default App;