import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';

const EditingControls = ({ setIsEditing }) => {
  const { t } = useLocalization();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('editingControls.title')}
      </h3>
      <div className="space-y-2">
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