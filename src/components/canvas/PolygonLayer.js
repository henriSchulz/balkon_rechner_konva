import React from 'react';
import { Layer, Line, Group, Rect, Text } from 'react-konva';
import { getDistance, pixelsToMeters } from '../../utils/geometry';

const PolygonLayer = ({
  points,
  scale,
  lockedEdges,
  hoveredEdgeIndex,
  hauswandEdges,
  showLengths,
  handleLengthClick,
  handleUnlockEdge,
  setHoveredEdgeIndex,
  handleHauswandSetzen,
  handleClearHauswand,
  handleStageClick,
  isEditing,
}) => {
  if (points.length < 2) return null;

  const linePoints = points.flatMap(point => [point.x, point.y]);

  return (
    <Layer>
      {/* Polygon Fill */}
      <Line
        points={linePoints}
        closed={true}
        stroke="transparent"
        strokeWidth={0}
        fill="rgba(0,0,255,0.1)"
        onClick={handleStageClick}
      />

      {/* Edges */}
      {points.map((point, i) => {
        const nextPoint = points[(i + 1) % points.length];
        const isHovered = hoveredEdgeIndex === i;
        const isLocked = lockedEdges.has(i);
        const midX = (point.x + nextPoint.x) / 2;
        const midY = (point.y + nextPoint.y) / 2;
        const distance = getDistance(point, nextPoint);
        const lengthInMeters = pixelsToMeters(distance, scale);

        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
        const degrees = (angle * 180) / Math.PI;
        const normalizedAngle = degrees > 90 || degrees < -90 ? degrees + 180 : degrees;

        const offsetDistance = 15;
        // ÄNDERUNG: + Math.PI / 2 zu - Math.PI / 2 geändert, um die Labels nach außen zu verschieben
        const perpAngle = angle - Math.PI / 2; 
        const textX = midX + Math.cos(perpAngle) * offsetDistance;
        const textY = midY + Math.sin(perpAngle) * offsetDistance;

        const prevEdgeIndex = (i - 1 + points.length) % points.length;
        const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
        const isNextEdgeLocked = lockedEdges.has((i + 1) % points.length);
        const isEditable = !isLocked && !(isPrevEdgeLocked && isNextEdgeLocked);

        return (
          <Group key={`edge-group-${i}`}>
            {/* Visible Edge Line */}
            <Line
              points={[point.x, point.y, nextPoint.x, nextPoint.y]}
              stroke={isHovered ? "#FF9500" : "#2563eb"}
              strokeWidth={isHovered ? 5 : 4}
              lineCap="round"
              lineJoin="round"
            />

            {/* Length Label */}
            {showLengths && (
              <Group
                x={textX}
                y={textY}
                rotation={normalizedAngle}
                onClick={(e) => {
                  if (isEditing) {
                    e.evt.stopPropagation();
                    if (isLocked) handleUnlockEdge(i);
                    else if (isEditable) handleLengthClick(i, lengthInMeters);
                  }
                }}
              >
                <Rect
                  x={-22} y={-7} width={44} height={14}
                  fill={isLocked ? "rgba(220,220,220,0.95)" : (!isEditable ? "rgba(255,100,100,0.95)" : (isEditing ? "rgba(255,255,255,0.95)" : "rgba(240,240,240,0.8)"))}
                  stroke={isLocked ? "#999" : (!isEditable ? "#ff4444" : (isEditing ? "#4CAF50" : "#ccc"))}
                  strokeWidth={1}
                  cornerRadius={7}
                />
                <Text
                  text={isLocked ? `🔒${lengthInMeters}m` : (!isEditable ? `🚫${lengthInMeters}m` : `${lengthInMeters}m`)}
                  fontSize={10}
                  fill={isLocked ? "#666" : (!isEditable ? "white" : (isEditing ? "#333" : "#888"))}
                  offsetX={isLocked ? 22 : (!isEditable ? 22 : 18)}
                  offsetY={5}
                />
              </Group>
            )}

            {/* Invisible Hover Area */}
            <Line
              points={[point.x, point.y, nextPoint.x, nextPoint.y]}
              stroke="transparent"
              strokeWidth={20}
              onMouseEnter={() => setHoveredEdgeIndex(i)}
              onMouseLeave={() => setHoveredEdgeIndex(null)}
              onClick={() => {
                if (hauswandEdges.includes(i)) handleClearHauswand();
                else handleHauswandSetzen(i);
              }}
            />
          </Group>
        );
      })}
    </Layer>
  );
};

export default PolygonLayer;