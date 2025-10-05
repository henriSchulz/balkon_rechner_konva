import React from 'react';
import { Layer, Circle, Group, Text, Line, Arc } from 'react-konva';

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
  isDrawing,
  isEditing,
  hoveredPointIndex,
  setHoveredPointIndex,
  handleStageClick,
  liveLength,
  liveAngle,
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
      {cursorPos && points.length > 0 && isDrawing && liveLength > 0 && (
        <Group listening={false}>
          {(() => {
            const lastPoint = points[points.length - 1];
            const newAngleRad = Math.atan2(cursorPos.y - lastPoint.y, cursorPos.x - lastPoint.x);

            let degrees, rotationDeg;

            if (points.length > 1) {
              const prevPoint = points[points.length - 2];
              const prevAngleRad = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
              let deltaAngleDeg = (newAngleRad - prevAngleRad) * 180 / Math.PI;
              if (deltaAngleDeg <= -180) deltaAngleDeg += 360;
              if (deltaAngleDeg > 180) deltaAngleDeg -= 360;

              degrees = deltaAngleDeg; // Signed angle for arc direction
              rotationDeg = prevAngleRad * 180 / Math.PI;
            } else {
              degrees = newAngleRad * 180 / Math.PI;
              rotationDeg = 0;
            }

            const midPoint = { x: (lastPoint.x + cursorPos.x) / 2, y: (lastPoint.y + cursorPos.y) / 2 };
            const absAngleDeg = newAngleRad * 180 / Math.PI;
            const textRotation = (absAngleDeg > 90 || absAngleDeg < -90) ? absAngleDeg + 180 : absAngleDeg;

            const angleDisplayGroup = [];
            const ANGLE_TOLERANCE = 1.5;
            const isRightAngle = Math.abs(liveAngle - 90) < ANGLE_TOLERANCE;

            if (isRightAngle) {
              const size = 15;
              const prevAngleRad = rotationDeg * Math.PI / 180;

              // Point on the previous segment's line, extended outwards from the corner
              const p1 = {
                x: lastPoint.x + size * Math.cos(prevAngleRad),
                y: lastPoint.y + size * Math.sin(prevAngleRad)
              };
              // Point on the new segment's line (perpendicular to the previous one)
              const p2 = {
                x: lastPoint.x + size * Math.cos(prevAngleRad + Math.PI / 2 * (degrees < 0 ? -1 : 1)),
                y: lastPoint.y + size * Math.sin(prevAngleRad + Math.PI / 2 * (degrees < 0 ? -1 : 1))
              };
              // The corner of the square symbol, forming a parallelogram with lastPoint
              const corner = { x: p1.x + p2.x - lastPoint.x, y: p1.y + p2.y - lastPoint.y };

              angleDisplayGroup.push(
                <Line key="right-angle-indicator" points={[p1.x, p1.y, corner.x, corner.y, p2.x, p2.y]} stroke="#666" strokeWidth={1.5} />
              );
            } else {
              const angleTextRadius = 45;
              const angleTextAngleRad = (rotationDeg * Math.PI / 180) + (degrees * Math.PI / 180 / 2);
              const angleTextPos = {
                x: lastPoint.x + angleTextRadius * Math.cos(angleTextAngleRad),
                y: lastPoint.y + angleTextRadius * Math.sin(angleTextAngleRad),
              };

              angleDisplayGroup.push(
                <Arc key="angle-arc" x={lastPoint.x} y={lastPoint.y} innerRadius={30} outerRadius={31} angle={degrees} rotation={rotationDeg} stroke="#666" strokeWidth={1} dash={[2, 2]} />,
                <Text key="angle-text" x={angleTextPos.x} y={angleTextPos.y} text={`${liveAngle.toFixed(1)}°`} fontSize={12} fill="#333" padding={4} backgroundColor="rgba(255, 255, 255, 0.85)" cornerRadius={4} offsetX={15} offsetY={8} />
              );
            }

            return (
              <>
                <Line points={[lastPoint.x, lastPoint.y, cursorPos.x, cursorPos.y]} stroke="#CF2B32" strokeWidth={1.5} dash={[6, 4]} />
                <Text x={midPoint.x} y={midPoint.y} text={`${liveLength.toFixed(2)} m`} fontSize={12} fill="#333" padding={4} backgroundColor="rgba(255, 255, 255, 0.85)" cornerRadius={4} rotation={textRotation} offsetX={15} offsetY={15} />
                {points.length > 1 && angleDisplayGroup}
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
            fill={isClosable ? '#4CAF50' : (isEditing ? '#f59e0b' : '#2563eb')}
            stroke="white"
            strokeWidth={2}
            draggable={isEditing || isDrawing}
            onDragStart={(e) => (isEditing || isDrawing) && handleDragStart(e, i)}
            onDragMove={(e) => (isEditing || isDrawing) && handleDragMove(e, i)}
            onDragEnd={(e) => (isEditing || isDrawing) && handleDragEnd(e, i)}
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
                      if (isEditing) {
                        e.evt.stopPropagation();
                        if (isAngleLocked) handleUnlockAngle(i);
                        else if (isAngleEditable) handleAngleClick(i, angles[i]);
                      }
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