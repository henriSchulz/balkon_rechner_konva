import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';

const DrawingActions = ({ points, handleUndo, setIsDrawing }) => {
  const { t } = useLocalization();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('drawingControls.title')}
      </h3>
      <div className="space-y-2">
        <button
          onClick={handleUndo}
          disabled={points.length === 0}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-md transition-colors duration-200"
        >
          {t('drawingControls.undo')}
        </button>
        <button
          onClick={() => setIsDrawing(false)}
          disabled={points.length < 3}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-md transition-colors duration-200"
        >
          {t('drawingControls.finishDrawing')}
        </button>
      </div>
    </div>
  );
};

export default DrawingActions;