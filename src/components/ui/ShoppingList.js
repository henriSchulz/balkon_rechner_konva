import React from 'react';

const ShoppingList = ({ profileData }) => {
  const handleAddToCart = () => {
    // TODO: Implement actual add to cart logic using the constants from `src/constants/api.js`
    alert('Alle Profile zur Karte hinzugefügt!');
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-orange-200 p-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
          <span className="text-orange-600">🛒</span>
          Einkaufsliste
        </h3>
        <button
          className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors duration-200"
          onClick={handleAddToCart}
        >
          Zum Warenkorb hinzufügen
        </button>
      </div>
      <div className="text-xs text-orange-700">
        <div className="font-medium mb-2">Bodenprofile 140mm breit:</div>
        <div className="space-y-1 overflow-y-auto">
          {Object.entries(profileData.profileCounts)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([length, count]) => (
              <div key={length} className="bg-orange-50 rounded p-2">
                <div className="font-medium text-orange-800">{count}x {length}mm</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;