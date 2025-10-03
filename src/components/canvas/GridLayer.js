import React from 'react';
import { Layer, Line } from 'react-konva';
import { CANVAS_SIZE } from '../../constants/canvas';

const GridLayer = ({ scale }) => {
  const gridLines = [];
  const gridSpacing = scale; // 1 Meter = scale Pixel

  for (let i = gridSpacing; i < CANVAS_SIZE; i += gridSpacing) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i, 0, i, CANVAS_SIZE]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, i, CANVAS_SIZE, i]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  return <Layer>{gridLines}</Layer>;
};

export default GridLayer;