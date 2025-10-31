import React, { useState } from 'react';
import { addToCart, COLORS, PRODUCTS } from '../../utils/api';
import { useLocalization } from '../../hooks/useLocalization';

const ShoppingList = ({ profileData, selectedProfile, setSelectedProfile }) => {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleAddToCart = async () => {
    if (!profileData || !profileData.profileCounts || Object.keys(profileData.profileCounts).length === 0) {
      alert(t('shoppingList.validationAlert'));
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    
  console.log('🛒 Starte Warenkorb-Hinzufügung mit profileData:', profileData);
  console.log('📊 Profile Counts:', profileData.profileCounts);
  console.log('🎨 Ausgewählte Farbe:', selectedColor);
  console.log('📦 Verfügbare Produkte:', PRODUCTS[selectedProfile]);
    
    try {
      const results = [];
      let successfulAdds = 0;
      let failedAdds = 0;

      for (const [length, count] of Object.entries(profileData.profileCounts)) {
        console.log(`🔍 Verarbeite Profil: ${length}mm, Anzahl: ${count}`);
        
        if (count <= 0) {
          console.log(`⏭️ Überspringe Profil ${length}mm (Anzahl: ${count})`);
          continue;
        }

        // Suche zuerst nach einer Produktvariation, die sowohl zur Länge passt als auch zur ausgewählten Farbe
        const product = PRODUCTS[selectedProfile].find(p => p.length == parseInt(length) && p.color === selectedColor);

        console.log(`🔍 Gesucht: ${length}mm in Farbe ${selectedColor}, Gefunden:`, product);

        if (!product) {
          // Keine Variante in der ausgewählten Farbe verfügbar -> als fehlgeschlagen melden und überspringen
          console.warn(`⚠️ Keine Variante für Länge ${length}mm in Farbe ${selectedColor} gefunden`);
          // Optional: Zeige verfügbare Farben/Längen für Debugging
          const availableForLength = PRODUCTS[selectedProfile].filter(p => p.length === parseInt(length)).map(p => p.color);
          console.log(`🔍 Verfügbare Farben für Länge ${length}mm:`, availableForLength.length > 0 ? availableForLength : '(keine)');
          results.push({ success: false, length, reason: `Keine Variante in Farbe ${selectedColor}` });
          failedAdds++;
          continue;
        }

        try {
          console.log(`🔄 Versuche ${count}x Profil ${length}mm (ID: ${product.id}) hinzuzufügen...`);
          
          const result = await addToCart(product.id, count);

          console.log(`✅ ${count}x Profil ${length}mm (ID: ${product.id}, Farbe: ${product.color}) erfolgreich hinzugefügt`);
          results.push({ success: true, length, count, productId: product.id, color: product.color, result });
          successfulAdds++;
          
        } catch (error) {
          console.error(`❌ Fehler beim Hinzufügen von ${count}x Profil ${length}mm (ID: ${product.id}):`, error);
          results.push({ success: false, length, count, productId: product.id, error: error.message || error.toString() });
          failedAdds++;
        }
      }

      console.log(`📋 Zusammenfassung: ${successfulAdds} erfolgreich, ${failedAdds} fehlgeschlagen`);
      console.log('📄 Detaillierte Ergebnisse:', results);
      
      if (successfulAdds > 0) {
        if (window.jQuery) {
          console.log('🔄 Aktualisiere WooCommerce Warenkorb-Fragment...');
          window.jQuery(document.body).trigger('wc_fragment_refresh');
        }
      }
      
      if (failedAdds > 0) {
        const totalAdds = successfulAdds + failedAdds;
        console.warn(`⚠️ ${failedAdds} Profile konnten nicht hinzugefügt werden. Siehe Details oben.`);
        alert(t('shoppingList.warningAlert', { failedAdds, totalAdds }));
      } else if (successfulAdds > 0) {
        alert(t('shoppingList.successAlert', { successfulAdds }));
      }
      
    } catch (error) {
      console.error('❌ Unerwarteter Fehler beim Hinzufügen der Profile zum Warenkorb:', error);
      alert(`Fehler: ${error.message || error.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('shoppingList.title')}
        </h3>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('shoppingList.profileType')}</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="S"
              checked={selectedProfile === 'S'}
              onChange={() => setSelectedProfile('S')}
              className="form-radio h-4 w-4 text-accent focus:ring-accent"
            />
            <span className="ml-2 text-sm text-gray-800">S (140mm)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="L"
              checked={selectedProfile === 'L'}
              onChange={() => setSelectedProfile('L')}
              className="form-radio h-4 w-4 text-accent focus:ring-accent"
            />
            <span className="ml-2 text-sm text-gray-800">L (200mm)</span>
          </label>
        </div>
      </div>

<div className="mb-4">

  <select onChange={e => setSelectedColor(e.target.value)} value={selectedColor} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md">
    {COLORS.map(color => (
      <option key={color} value={color}>{color}</option>
    ))}
  </select>

</div>

      
      <div className="text-sm text-gray-700">
        <div className="font-medium mb-2 text-gray-800">{t('shoppingList.floorProfilesLabel')} ({selectedProfile === 'S' ? '140mm' : '200mm'})</div>
        {Object.keys(profileData.profileCounts).length > 0 ? (
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
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p>{t('shoppingList.noProfilesCalculated')}</p>
            <p className="text-xs mt-1">{t('shoppingList.drawInstructions')}</p>
          </div>
        )}
      </div>
        <button 
          className={`flex justify-center gap-4 items-center w-full mb-3 px-3 py-2 text-white text-md font-medium rounded-md transition-colors duration-200 ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-accent hover:bg-accent/90'
          }`}
          onClick={handleAddToCart}
          disabled={isLoading || !profileData || !profileData.profileCounts || Object.keys(profileData.profileCounts).length === 0}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('shoppingList.addingToCart')}
            </>
          ) : (
            <>
              <i className="icon-shopping-cart"></i>
              {t('shoppingList.addToCart')}
            </>
          )}
        </button>
    </div>
  );
};

export default ShoppingList;