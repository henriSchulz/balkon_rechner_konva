import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';

const EditingControls = ({
  setIsEditing,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
}) => {
  const { t } = useLocalization();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('editingControls.title')}
      </h3>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors duration-200"
          >
            {t('drawingControls.undo')}
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors duration-200"
          >
            {t('drawingControls.redo')}
          </button>
        </div>
        <button
          onClick={() => setIsEditing(false)}
          className="w-full px-4 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-md transition-colors duration-200"
        >
          {t('editingControls.finishEditing')}
        </button>
      </div>
    </div>
  );
};

export default EditingControls;