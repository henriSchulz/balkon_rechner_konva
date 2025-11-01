import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';

const EditingModals = ({
  editingEdge,
  editingLength,
  setEditingLength,
  handleLengthChange,
  handleLengthCancel,
  editingAngle,
  editingAngleValue,
  setEditingAngleValue,
  handleAngleChange,
  handleAngleCancel,
}) => {
  const { t } = useLocalization();

  if (editingEdge === null && editingAngle === null) return null;

  const Modal = ({ title, children }) => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-5 border border-gray-200 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );

  const ActionButtons = ({ onOk, onCancel, okText, cancelText }) => (
    <div className="flex justify-end gap-2 mt-4">
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-md transition-colors duration-200"
      >
        {cancelText}
      </button>
      <button
        onClick={onOk}
        className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-md transition-colors duration-200"
      >
        {okText}
      </button>
    </div>
  );

  return (
    <>
      {editingEdge !== null && (
        <Modal title={t('editingModals.edge.title')}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editingLength}
              onChange={(e) => setEditingLength(e.target.value)}
              step="10"
              min="1"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-accent/80 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleLengthChange(editingLength);
                else if (e.key === 'Escape') handleLengthCancel();
              }}
            />
            <span className="text-gray-600 text-lg">{t('editingModals.edge.unit')}</span>
          </div>
          <ActionButtons
            onOk={() => handleLengthChange(editingLength)}
            onCancel={handleLengthCancel}
            okText={t('editingModals.edge.confirm')}
            cancelText={t('editingModals.edge.cancel')}
          />
        </Modal>
      )}

      {editingAngle !== null && (
        <Modal title={t('editingModals.angle.title')}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editingAngleValue}
              onChange={(e) => setEditingAngleValue(e.target.value)}
              step="1"
              min="1"
              max="179"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-accent/80 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAngleChange(editingAngleValue);
                else if (e.key === 'Escape') handleAngleCancel();
              }}
            />
            <span className="text-gray-600 text-lg">{t('editingModals.angle.unit')}</span>
          </div>
          <ActionButtons
            onOk={() => handleAngleChange(editingAngleValue)}
            onCancel={handleAngleCancel}
            okText={t('editingModals.angle.confirm')}
            cancelText={t('editingModals.angle.cancel')}
          />
        </Modal>
      )}
    </>
  );
};

export default EditingModals;