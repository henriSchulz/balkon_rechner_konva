import { useState } from 'react';
import { Stage, Layer, Circle, Line, Text } from 'react-konva';

const GRID_SIZE = 50;
const CANVAS_SIZE = 700;

function getAngle(p0, p1, p2) {
  const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
  const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  const angleRad = Math.acos(dot / (mag1 * mag2));
  return Math.round((angleRad * 180) / Math.PI);
}

const CanvasComponent = () => {
  const [points, setPoints] = useState([]);

  const handleStageClick = (e) => {
    if (e.target instanceof window.Konva.Circle) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setPoints([...points, pos]);
  };

  const handleDragMove = (e, idx) => {
    const { x, y } = e.target.position();
    setPoints(points =>
      points.map((point, i) => (i === idx ? { x, y } : point))
    );
  };

  const linePoints = points.flatMap(point => [point.x, point.y]);

  // Grid-Linien vorbereiten
  const gridLines = [];
  for (let i = GRID_SIZE; i < CANVAS_SIZE; i += GRID_SIZE) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i, 0, i, CANVAS_SIZE]}
        stroke="#ddd"
        strokeWidth={1}
      />
    );
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, i, CANVAS_SIZE, i]}
        stroke="#ddd"
        strokeWidth={1}
      />
    );
  }

  // Winkel berechnen
  const angles = points.length > 2
    ? points.map((p, i, arr) => {
        const prev = arr[(i - 1 + arr.length) % arr.length];
        const next = arr[(i + 1) % arr.length];
        return getAngle(prev, p, next);
      })
    : [];

  return (
    <Stage
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{ border: '1px solid black', height: '700px', width: '700px' }}
      onMouseDown={handleStageClick}
    >
      <Layer>
        {gridLines}
      </Layer>
      <Layer>
        {points.length > 1 && (
          <Line
            points={linePoints}
            closed={true}
            stroke="blue"
            strokeWidth={2}
            fill="rgba(0,0,255,0.1)"
          />
        )}
        {points.map((point, i) => (
          <div key={i}>
            <Circle
              x={point.x}
              y={point.y}
              radius={7}
              fill="blue"
              draggable
              onDragMove={e => handleDragMove(e, i)}
            />
            {angles[i] !== undefined && (
              <Text
                x={point.x + 10}
                y={point.y - 20}
                text={`${angles[i]}°`}
                fontSize={16}
                fill="black"
              />
            )}
          </div>
        ))}
      </Layer>
    </Stage>
  );
};

export default CanvasComponent;