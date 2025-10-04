import React from 'react';
import { Layer, Circle, Group, Text, Line } from 'react-konva';
import { pixelsToMeters, getDistance } from '../../utils/geometry';

const InteractionLayer = ({
  points,
  angles,
  lockedAngles,
  lockedEdges,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  handleAngleClick,
  handleUnlockAngle,
  snapLines,
  cursorPos,
  scale,
  isDrawing,
  hoveredPointIndex,
  setHoveredPointIndex,
  handleStageClick,
}) => {
  return (
    <Layer>
      {/* Snap-Hilfslinien */}
      {snapLines.map((line, i) => (
        <Line
          key={`snap-line-${i}`}
          points={line.points}
          stroke={line.type === 'axis' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)'}
          strokeWidth={1}
          dash={line.type === 'axis' ? [4, 4] : [2, 2]}
          listening={false} // Verhindert, dass die Linien auf Klicks reagieren
        />
      ))}

      {/* Smart Guides - Vorschau für die nächste Linie */}
      {cursorPos && points.length > 0 && isDrawing && (
        <Group>
          {(() => {
            const lastPoint = points[points.length - 1];
            const distance = getDistance(lastPoint, cursorPos);
            const lengthInMeters = pixelsToMeters(distance, scale);
            const angle = Math.atan2(cursorPos.y - lastPoint.y, cursorPos.x - lastPoint.x);
            const degrees = (angle * 180) / Math.PI;

            return (
              <>
                <Line
                  points={[lastPoint.x, lastPoint.y, cursorPos.x, cursorPos.y]}
                  stroke="#4CAF50"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
                <Text
                  x={cursorPos.x + 20}
                  y={cursorPos.y}
                  zIndex={-10}
                  text={`${lengthInMeters} m / ${degrees.toFixed(1)}°`}
                  fontSize={12}
                  fill="#333"
                  padding={4}
                  backgroundColor="rgba(255, 255, 255, 0.75)"
                  cornerRadius={4}
                />
              </>
            );
          })()}
        </Group>
      )}

      {/* Points and Angles */}
      {points.map((point, i) => {
        const isClosable = isDrawing && i === 0 && points.length > 2 && hoveredPointIndex === 0;

        return (
        <Group key={`point-group-${i}`}>
          {/* Draggable Point */}
          <Circle
            x={point.x}
            y={point.y}
            radius={isClosable ? 10 : 6}
            fill={isClosable ? '#4CAF50' : '#2563eb'}
            stroke="white"
            strokeWidth={2}
            draggable={!isDrawing}
            onDragStart={(e) => !isDrawing && handleDragStart(e, i)}
            onDragMove={(e) => !isDrawing && handleDragMove(e, i)}
            onDragEnd={(e) => !isDrawing && handleDragEnd(e, i)}
            onMouseEnter={() => isDrawing && i === 0 && setHoveredPointIndex(i)}
            onMouseLeave={() => isDrawing && i === 0 && setHoveredPointIndex(null)}
            onClick={(e) => {
              if (isDrawing && i === 0 && points.length > 2) {
                e.evt.stopPropagation(); // prevent stage click
                handleStageClick(e); // will trigger the close logic
              }
            }}
          />

          {/* Angle Label */}
          {!isDrawing && angles[i] !== undefined && (
            <Group>
              {(() => {
                const prevEdgeIndex = (i - 1 + points.length) % points.length;
                const nextEdgeIndex = i;
                const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
                const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);
                const isAngleLocked = lockedAngles.has(i);
                const isAngleEditable = !isAngleLocked && !(isPrevEdgeLocked && isNextEdgeLocked);

                const prev = points[(i - 1 + points.length) % points.length];
                const next = points[(i + 1) % points.length];
                const dirPrev = Math.atan2(prev.y - point.y, prev.x - point.x);
                const dirNext = Math.atan2(next.y - point.y, next.x - point.x);
                let avgDir = (dirPrev + dirNext) / 2;
                if (Math.abs(dirPrev - dirNext) > Math.PI) avgDir += Math.PI;

                const radius = 30;
                const textX = point.x + Math.cos(avgDir) * radius;
                const textY = point.y + Math.sin(avgDir) * radius;
                let degrees = (avgDir * 180) / Math.PI;
                if (degrees > 90 || degrees < -90) degrees += 180;

                return (
                  <Text
                    x={textX}
                    y={textY}
                    text={isAngleLocked ? `🔒${angles[i]}°` : (!isAngleEditable ? `🚫${angles[i]}°` : `${angles[i]}°`)}
                    fontSize={10}
                    fill={isAngleLocked ? "#666" : (!isAngleEditable ? "white" : "#9c27b0")}
                    fontFamily="Arial, sans-serif"
                    fontStyle="bold"
                    offsetX={18}
                    offsetY={5}
                    rotation={degrees}
                    onClick={(e) => {
                      e.evt.stopPropagation();
                      if (isAngleLocked) handleUnlockAngle(i);
                      else if (isAngleEditable) handleAngleClick(i, angles[i]);
                    }}
                  />
                );
              })()}
            </Group>
          )}
        </Group>
      )})}
    </Layer>
  );
};

export default InteractionLayer;