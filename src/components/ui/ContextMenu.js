import React from 'react';
import { createPortal } from 'react-dom';

const ContextMenu = ({ visible, x, y, pointIndex, handleDeletePoint, handleCloseContextMenu }) => {
    if (!visible) {
        return null;
    }

    const style = {
        position: 'absolute',
        top: `${y}px`,
        left: `${x}px`,
        zIndex: 1000,
    };

    const handleDelete = () => {
        if (pointIndex !== null) {
            handleDeletePoint(pointIndex);
        }
    };

    // Use a portal to render the menu at the top level of the DOM to avoid clipping issues
    return createPortal(
        <div
            style={style}
            className="bg-white rounded-md shadow-lg border border-gray-200 py-1"
        >
            <button
                onClick={handleDelete}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-500 hover:text-white"
            >
                Punkt löschen
            </button>
        </div>,
        document.body
    );
};

export default ContextMenu;