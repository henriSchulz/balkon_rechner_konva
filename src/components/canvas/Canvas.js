import React from 'react';
import { Stage } from 'react-konva';
import GridLayer from './GridLayer';
import ProfilesLayer from './ProfilesLayer';
import PolygonLayer from './PolygonLayer';
import InteractionLayer from './InteractionLayer';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_VIEWPORT_WIDTH, CANVAS_VIEWPORT_HEIGHT } from '../../constants/canvas';

const Canvas = ({ state, handlers }) => {
  const {
    points,
    scale,
    lockedEdges,
    hoveredEdgeIndex,
    hauswandEdges,
    showLengths,
    angles,
    lockedAngles,
    snapLines,
    cursorPos,
    showProfiles,
    profileData,
  } = state;

  const {
    handleLengthClick,
    handleUnlockEdge,
    setHoveredEdgeIndex,
    handleHauswandSetzen,
    handleClearHauswand,
    handleStageClick,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleAngleClick,
    handleUnlockAngle,
    setCursorPos,
    snapEnabled,
    setSnapLines
  } = handlers;

  const { getSnappedPos } = require('../../utils/snap');

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-4 inline-block">
      <div
        className="bg-gray-50 rounded-lg border-2 border-gray-200 overflow-x-auto overflow-y-auto"
        style={{ width: CANVAS_VIEWPORT_WIDTH, height: CANVAS_VIEWPORT_HEIGHT }}
      >
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleStageClick}
          onMouseMove={(e) => {
            const stage = e.target.getStage();
            const pos = stage.getPointerPosition();
            if (snapEnabled && points.length > 0) {
              const lastPoint = points[points.length - 1];
              const snappedPos = getSnappedPos(pos, points, lastPoint, scale, setSnapLines);
              setCursorPos(snappedPos);
            } else {
              setCursorPos(pos);
            }
          }}
          onMouseLeave={() => setCursorPos(null)}
        >
          <GridLayer width={CANVAS_WIDTH} height={CANVAS_HEIGHT} scale={scale} />
          <ProfilesLayer showProfiles={showProfiles} profileData={profileData} />
          <PolygonLayer
            points={points}
            scale={scale}
            lockedEdges={lockedEdges}
            hoveredEdgeIndex={hoveredEdgeIndex}
            hauswandEdges={hauswandEdges}
            showLengths={showLengths}
            handleLengthClick={handleLengthClick}
            handleUnlockEdge={handleUnlockEdge}
            setHoveredEdgeIndex={setHoveredEdgeIndex}
            handleHauswandSetzen={handleHauswandSetzen}
            handleClearHauswand={handleClearHauswand}
            handleStageClick={handleStageClick}
          />
          <InteractionLayer
            points={points}
            angles={angles}
            lockedAngles={lockedAngles}
            lockedEdges={lockedEdges}
            handleDragStart={handleDragStart}
            handleDragMove={handleDragMove}
            handleDragEnd={handleDragEnd}
            handleAngleClick={handleAngleClick}
            handleUnlockAngle={handleUnlockAngle}
            snapLines={snapLines}
            cursorPos={cursorPos}
            scale={scale}
          />
        </Stage>
      </div>
    </div>
  );
};

export default Canvas;