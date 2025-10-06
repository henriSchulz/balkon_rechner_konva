import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';

const InfoPanel = ({ errorMessage }) => {
  const { t } = useLocalization();

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          {t('infoPanel.title')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2 text-xs text-gray-600">
          <p><strong>{t('infoPanel.pointInstruction')}</strong> {t('infoPanel.pointAction')}</p>
          <p><strong>{t('infoPanel.lengthInstruction')}</strong> {t('infoPanel.lengthAction')}</p>
          <p><strong>{t('infoPanel.angleInstruction')}</strong> {t('infoPanel.angleAction')}</p>
          <p><strong>{t('infoPanel.wallInstruction')}</strong> {t('infoPanel.wallAction')}</p>
          <p><strong>{t('infoPanel.profileInstruction')}</strong> {t('infoPanel.profileAction')}</p>
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