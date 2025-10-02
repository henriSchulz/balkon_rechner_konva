import React, { useState } from 'react';
import { Stage, Layer, Circle } from 'react-konva';

const CanvasComponent = () => {
  const [points, setPoints] = useState([]);

  const handleStageClick = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setPoints([...points, pos]);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleStageClick}
    >
      <Layer>
        {points.map((point, i) => (
          <Circle key={i} x={point.x} y={point.y} radius={5} fill="black" />
        ))}
      </Layer>
    </Stage>
  );
};

export default CanvasComponent;