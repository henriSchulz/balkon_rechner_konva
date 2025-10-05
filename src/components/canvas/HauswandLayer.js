import React, { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

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

// Helper function to determine polygon winding order via signed area
const getSignedPolygonArea = (points) => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += (p1.x * p2.y - p2.x * p1.y);
  }
  return area / 2;
};

const HauswandLayer = ({ points, hauswandEdges }) => {
  // Memoize the pattern so it's not recreated on every render
  const hatchPattern = useMemo(() => createHatchPattern(), []);

  // A polygon and its area are only defined for 3 or more points
  if (hauswandEdges.length === 0 || points.length < 3) {
    return null;
  }

  const edgeIndex = hauswandEdges[0];
  const p1 = points[edgeIndex];
  const p2 = points[(edgeIndex + 1) % points.length];

  if (!p1 || !p2) return null;

  // Define the thickness of the wall representation
  const wallThickness = 50;

  // Calculate the vector of the wall edge and its length
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);

  if (wallLength === 0) return null;

  // Calculate the normalized normal vector to the edge
  const normalX = -dy / wallLength;
  const normalY = dx / wallLength;

  // Use the polygon's winding order to ensure the normal points "outside"
  const signedArea = getSignedPolygonArea(points);
  // For a CCW polygon (positive area), the normal (-dy, dx) points inward.
  // We need to move in the opposite direction to go "outside".
  const direction = signedArea >= 0 ? -1 : 1;

  // Calculate the four corners of the wall rectangle by translating along the normal
  const wallP1 = { x: p1.x, y: p1.y };
  const wallP2 = { x: p2.x, y: p2.y };
  const wallP3 = {
    x: p2.x + normalX * wallThickness * direction,
    y: p2.y + normalY * wallThickness * direction,
  };
  const wallP4 = {
    x: p1.x + normalX * wallThickness * direction,
    y: p1.y + normalY * wallThickness * direction,
  };

  const wallPoints = [
    wallP1.x, wallP1.y,
    wallP2.x, wallP2.y,
    wallP3.x, wallP3.y,
    wallP4.x, wallP4.y,
  ];

  return (
    <Layer>
      <Line
        points={wallPoints}
        closed={true}
        fillPatternImage={hatchPattern}
        fillPatternRepeat="repeat"
        listening={false}
      />
    </Layer>
  );
};

export default HauswandLayer;