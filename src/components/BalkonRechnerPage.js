import React from 'react';
import { useCanvasState } from '../hooks/useCanvasState';
import InfoPanel from './ui/InfoPanel';
import PointsList from './ui/PointsList';
import ResultsPanel from './ui/ResultsPanel';
import ShoppingList from './ui/ShoppingList';
import EditingModals from './ui/EditingModals';
import Canvas from './canvas/Canvas';
import DrawingActions from './ui/DrawingActions';

const BalkonRechnerPage = () => {
    const {
        // State
        points, isDrawing, setIsDrawing, snapEnabled, hoveredEdgeIndex, setHoveredEdgeIndex,
        hoveredPointIndex, setHoveredPointIndex, hauswandEdges, scale, showLengths,
        editingEdge, editingLength, setEditingLength, lockedEdges, editingAngle, editingAngleValue,
        setEditingAngleValue, lockedAngles, errorMessage, cursorPos, setCursorPos, snapLines,
        setSnapLines, showProfiles,

        // Handlers
        handleStageClick, handleHauswandSetzen, handleClearHauswand, handleLengthClick, handleAngleClick,
        handleLengthChange, handleAngleChange, handleAngleCancel, handleLengthCancel, handleUnlockEdge,
        handleUnlockAngle, handleDeletePoint, handleClearAllPoints, handleDragStart, handleDragMove, handleDragEnd,
        handleUndo,

        // Derived Data
        angles, polygonArea, profileData
    } = useCanvasState();

    const canvasState = {
        points, scale, lockedEdges, hoveredEdgeIndex, hauswandEdges, showLengths, angles, lockedAngles,
        snapLines, cursorPos, showProfiles, profileData, snapEnabled, isDrawing, hoveredPointIndex
    };

    const canvasHandlers = {
        handleLengthClick, handleUnlockEdge, setHoveredEdgeIndex, handleHauswandSetzen, handleClearHauswand,
        handleStageClick, handleDragStart, handleDragMove, handleDragEnd, handleAngleClick, handleUnlockAngle,
        setCursorPos, setSnapLines, snapEnabled, setHoveredPointIndex
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
                    {points.length >= 3 && <ResultsPanel polygonArea={polygonArea} />}
                    <PointsList
                        points={points}
                        scale={scale}
                        handleDeletePoint={handleDeletePoint}
                        handleClearAllPoints={handleClearAllPoints}
                        isDrawing={isDrawing}
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
        </div>
    );
};

export default BalkonRechnerPage;