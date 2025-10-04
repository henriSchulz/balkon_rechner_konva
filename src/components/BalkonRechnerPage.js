import React from 'react';
import { useCanvasState } from '../hooks/useCanvasState';
import { useLocalization } from '../hooks/useLocalization';
import InfoPanel from './ui/InfoPanel';
import PointsList from './ui/PointsList';
import ResultsPanel from './ui/ResultsPanel';
import ShoppingList from './ui/ShoppingList';
import EditingModals from './ui/EditingModals';
import ContextMenu from './ui/ContextMenu';
import Canvas from './canvas/Canvas';
import DrawingActions from './ui/DrawingActions';
import EditingControls from './ui/EditingControls';

const BalkonRechnerPage = () => {
    const { t } = useLocalization();
    const {
        // State
        points, isDrawing, setIsDrawing, isEditing, setIsEditing, snapEnabled, hoveredEdgeIndex, setHoveredEdgeIndex,
        hoveredPointIndex, setHoveredPointIndex, hauswandEdges, scale, showLengths,
        editingEdge, editingLength, setEditingLength, lockedEdges, editingAngle, editingAngleValue,
        setEditingAngleValue, lockedAngles, errorMessage, cursorPos, setCursorPos, snapLines,
        setSnapLines, showProfiles, contextMenu,

        // Handlers
        handleStageClick, handleHauswandSetzen, handleClearHauswand, handleLengthClick, handleAngleClick,
        handleLengthChange, handleAngleChange, handleAngleCancel, handleLengthCancel, handleUnlockEdge,
        handleUnlockAngle, handleDeletePoint, handleClearAllPoints, handleDragStart, handleDragMove, handleDragEnd,
        handleUndo, handleStageContextMenu, handleCloseContextMenu,

        // Derived Data
        angles, polygonArea, profileData
    } = useCanvasState();

    const canvasState = {
        points, scale, lockedEdges, hoveredEdgeIndex, hauswandEdges, showLengths, angles, lockedAngles,
        snapLines, cursorPos, showProfiles, profileData, snapEnabled, isDrawing, hoveredPointIndex, isEditing
    };

    const canvasHandlers = {
        handleLengthClick, handleUnlockEdge, setHoveredEdgeIndex, handleHauswandSetzen, handleClearHauswand,
        handleStageClick, handleDragStart, handleDragMove, handleDragEnd, handleAngleClick, handleUnlockAngle,
        setCursorPos, setSnapLines, snapEnabled, setHoveredPointIndex, handleStageContextMenu
    };

    return (
        <div className="space-y-4">
            {/* Bedienungshinweise ganz oben */}
            <InfoPanel errorMessage={errorMessage} />
            
            {/* Hauptinhalt: Einkaufsliste, Canvas, Sidebar */}
            <div className="flex justify-center items-start space-x-6">
                {/* Einkaufsliste links */}
                <div className="w-64 flex-shrink-0">
                    <ShoppingList profileData={profileData} />
                </div>

                {/* Canvas in der Mitte */}
                <div className="flex-grow flex justify-center">
                    <Canvas state={canvasState} handlers={canvasHandlers} />
                </div>

                {/* Sidebar rechts */}
                <div className="w-60 flex-shrink-0 space-y-4">
                    {isDrawing && points.length > 0 && (
                        <DrawingActions
                            points={points}
                            handleUndo={handleUndo}
                            setIsDrawing={setIsDrawing}
                        />
                    )}
                    {isEditing && <EditingControls setIsEditing={setIsEditing} />}
                    {!isDrawing && points.length >= 3 && !isEditing && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200"
                            >
                                {t('editingControls.editDrawing')}
                            </button>
                        </div>
                    )}
                    {points.length >= 3 && <ResultsPanel polygonArea={polygonArea} />}
                    <PointsList
                        points={points}
                        scale={scale}
                        handleDeletePoint={handleDeletePoint}
                        handleClearAllPoints={handleClearAllPoints}
                        isDrawing={isDrawing}
                        isEditing={isEditing}
                    />
                </div>
            </div>

            {/* Modals */}
            <EditingModals
                editingEdge={editingEdge}
                editingLength={editingLength}
                setEditingLength={setEditingLength}
                handleLengthChange={handleLengthChange}
                handleLengthCancel={handleLengthCancel}
                editingAngle={editingAngle}
                editingAngleValue={editingAngleValue}
                setEditingAngleValue={setEditingAngleValue}
                handleAngleChange={handleAngleChange}
                handleAngleCancel={handleAngleCancel}
            />

            {/* Context Menu */}
            <ContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                pointIndex={contextMenu.pointIndex}
                handleDeletePoint={handleDeletePoint}
                handleCloseContextMenu={handleCloseContextMenu}
            />
        </div>
    );
};

export default BalkonRechnerPage;