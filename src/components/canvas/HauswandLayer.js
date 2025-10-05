import React, { useMemo } from 'react';
import { Layer, Rect } from 'react-konva';

// Function to create the hatching pattern
const createHatchPattern = () => {
  const patternCanvas = document.createElement('canvas');
  const patternContext = patternCanvas.getContext('2d');
  const patternSize = 20;
  patternCanvas.width = patternSize;
  patternCanvas.height = patternSize;

  // Background color
  patternContext.fillStyle = '#E2E8F0'; // A light gray color (e.g., gray-200 from Tailwind)
  patternContext.fillRect(0, 0, patternSize, patternSize);

  // Hatch lines
  patternContext.strokeStyle = '#A0AEC0'; // A darker gray (e.g., gray-500)
  patternContext.lineWidth = 1;
  patternContext.beginPath();
  patternContext.moveTo(0, patternSize);
  patternContext.lineTo(patternSize, 0);
  patternContext.stroke();

  return patternCanvas;
};

const HauswandLayer = ({ points, hauswandEdges }) => {
  // Memoize the pattern so it's not recreated on every render
  const hatchPattern = useMemo(() => createHatchPattern(), []);

  if (hauswandEdges.length === 0 || points.length < 2) {
    return null;
  }

  const edgeIndex = hauswandEdges[0];
  const p1 = points[edgeIndex];
  const p2 = points[(edgeIndex + 1) % points.length];

  if (!p1 || !p2) return null;

  // Calculate the vector and angle of the wall edge
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx);

  // Define the thickness of the wall representation
  const wallThickness = 50;

  // The rectangle starts at p1 and extends along the edge vector
  const wallLength = Math.sqrt(dx * dx + dy * dy);

  return (
    <Layer>
      <Rect
        x={p1.x}
        y={p1.y}
        width={wallLength}
        height={wallThickness}
        fillPatternImage={hatchPattern}
        fillPatternRepeat="repeat"
        rotation={angle * (180 / Math.PI)} // Konva uses degrees for rotation
        offsetX={0}
        offsetY={wallThickness / 2} // Center the wall on the edge
        listening={false} // The wall should not be interactive
      />
    </Layer>
  );
};

export default HauswandLayer;