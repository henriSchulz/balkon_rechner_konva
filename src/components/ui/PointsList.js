import React from 'react';
import { pixelsToMeters } from '../../utils/geometry';
import { useLocalization } from '../../hooks/useLocalization';

const PointsList = ({ points, scale, handleDeletePoint, handleClearAllPoints, isDrawing }) => {
  const { t } = useLocalization();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('pointsList.title')} ({points.length})
        </h3>
        <button
          onClick={handleClearAllPoints}
          className={`px-3 py-1 bg-accent hover:bg-accent/90 text-white text-xs font-medium rounded-md transition-colors duration-200 ${isDrawing && points.length > 0 ? 'hidden' : ''}`}
          title={t('drawingControls.newDrawing')}
        >
          {t('drawingControls.newDrawing')}
        </button>
      </div>
      {points.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {points.map((point, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-2 text-sm">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{t('pointsList.corner')} {index + 1}</div>
                <div className="text-gray-600 text-xs">
                  x: {Math.round(pixelsToMeters(point.x, scale) * 1000)}mm, y: {Math.round(pixelsToMeters(point.y, scale) * 1000)}mm
                </div>
              </div>
              <button
                onClick={() => handleDeletePoint(index)}
                disabled={points.length <= 3 || isDrawing}
                className="ml-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 text-xs rounded-md transition-colors duration-200"
                title={(points.length <= 3 || isDrawing) ? t('pointsList.deleteDisabledTooltip') : t('pointsList.deleteTooltip')}
              >
                {t('pointsList.delete')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">{t('pointsList.noPoints')}</div>
      )}
    </div>
  );
};

export default PointsList;