import React from 'react';
import { useCanvasState } from '../hooks/useCanvasState';
import InfoPanel from './ui/InfoPanel';
import SettingsPanel from './ui/SettingsPanel';
import PointsList from './ui/PointsList';
import ResultsPanel from './ui/ResultsPanel';
import ShoppingList from './ui/ShoppingList';
import EditingModals from './ui/EditingModals';
import Canvas from './canvas/Canvas';

const BalkonRechnerPage = () => {
    const {
        // State
        points, snapEnabled, setSnapEnabled, hoveredEdgeIndex, setHoveredEdgeIndex, hauswandEdges, scale, setScale,
        showLengths, setShowLengths, editingEdge, editingLength, setEditingLength, lockedEdges, setLockedEdges,
        editingAngle, editingAngleValue, setEditingAngleValue, lockedAngles, setLockedAngles, errorMessage,
        cursorPos, setCursorPos, snapLines, setSnapLines, showProfiles, setShowProfiles,

        // Handlers
        handleStageClick, handleHauswandSetzen, handleClearHauswand, handleLengthClick, handleAngleClick, handleLengthChange,
        handleAngleChange, handleAngleCancel, handleLengthCancel, handleUnlockEdge, handleUnlockAngle,
        handleDeletePoint, handleClearAllPoints, handleDragStart, handleDragMove, handleDragEnd,

        // Derived Data
        angles, polygonArea, profileData
    } = useCanvasState();

    const canvasState = {
        points, scale, lockedEdges, hoveredEdgeIndex, hauswandEdges, showLengths, angles, lockedAngles,
        snapLines, cursorPos, showProfiles, profileData, snapEnabled
    };

    const canvasHandlers = {
        handleLengthClick, handleUnlockEdge, setHoveredEdgeIndex, handleHauswandSetzen, handleClearHauswand, handleStageClick,
        handleDragStart, handleDragMove, handleDragEnd, handleAngleClick, handleUnlockAngle, setCursorPos,
        setSnapLines, snapEnabled
    };

    return (
        <div className="flex justify-center items-start space-x-8">
            {/* Main Content: Canvas and UI */}
            <div className="flex-grow space-y-4">
                <InfoPanel errorMessage={errorMessage} />
                <div className='flex flex-row w-full gap-4'>
                    <Canvas state={canvasState} handlers={canvasHandlers} />
                    {profileData.totalLength > 0 && <ShoppingList profileData={profileData} />}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 space-y-4">
                <SettingsPanel
                    scale={scale} setScale={setScale}
                    showLengths={showLengths} setShowLengths={setShowLengths}
                    snapEnabled={snapEnabled} setSnapEnabled={setSnapEnabled}
                    showProfiles={showProfiles} setShowProfiles={setShowProfiles}
                    lockedEdges={lockedEdges} setLockedEdges={setLockedEdges}
                    lockedAngles={lockedAngles} setLockedAngles={setLockedAngles}
                />
                {points.length >= 3 && <ResultsPanel polygonArea={polygonArea} />}
                <PointsList
                    points={points}
                    scale={scale}
                    handleDeletePoint={handleDeletePoint}
                    handleClearAllPoints={handleClearAllPoints}
                />
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