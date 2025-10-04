import React from 'react';

const ShoppingList = ({ profileData }) => {
  const handleAddToCart = () => {
    // TODO: Implement actual add to cart logic using the constants from `src/constants/api.js`
    alert('Alle Profile zur Karte hinzugefügt!');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Einkaufsliste
        </h3>
      </div>
        <button
          className="flex justify-center gap-4 items-center w-full mb-3 px-3 py-2 bg-accent hover:bg-accent/90 text-white text-md font-medium rounded-md transition-colors duration-200"
          onClick={handleAddToCart}
        >
          <i class="icon-shopping-cart"></i>
          Zum Warenkorb
        </button>
      <div className="text-sm text-gray-700">
        <div className="font-medium mb-2 text-gray-800">Bodenprofile (140mm breit):</div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {Object.entries(profileData.profileCounts)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([length, count]) => (
              <div key={length} className="bg-gray-50 rounded-md p-2 flex justify-between items-center">
                <span className="font-medium text-gray-800">{count}x</span>
                <span className="text-gray-600">{length}mm</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;