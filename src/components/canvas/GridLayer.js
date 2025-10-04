import React from 'react';
import { Layer, Line } from 'react-konva';

const GridLayer = ({ width, height, scale }) => {
  const gridLines = [];
  const gridSpacing = scale; // 1 Meter = scale Pixel

  // Vertical lines
  for (let i = gridSpacing; i < width; i += gridSpacing) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i, 0, i, height]}
        stroke="#e0e0e0"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let i = gridSpacing; i < height; i += gridSpacing) {
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, i, width, i]}
        stroke="#e0e0e0"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return <Layer listening={false}>{gridLines}</Layer>;
};

export default GridLayer;