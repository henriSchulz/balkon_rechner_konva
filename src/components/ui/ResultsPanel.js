import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';

const ResultsPanel = ({ polygonArea }) => {
  const { t } = useLocalization();
  if (polygonArea === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('resultsPanel.title')}</h2>
      <div className="w-full bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600">{t('resultsPanel.area')}</h3>
        <p className="text-xl font-bold text-gray-900">{polygonArea.toFixed(2)} m²</p>
      </div>
    </div>
  );
};

export default ResultsPanel;