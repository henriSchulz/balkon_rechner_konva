export function getAngle(p0, p1, p2) {
  const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
  const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  // Vermeiden Division durch Null
  if (mag1 === 0 || mag2 === 0) return 0;

  // Begrenze den Cosinus-Wert um numerische Fehler zu vermeiden
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));

  const angleRad = Math.acos(cosAngle);
  const angleDeg = (angleRad * 180) / Math.PI;

  // Runde auf ganze Grad
  return Math.round(angleDeg);
}

export function pixelsToMeters(pixels, scale) {
  return (pixels / scale).toFixed(2);
}

export function metersToPixels(meters, scale) {
  return meters * scale;
}

export function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculatePolygonArea(points, scale) {
  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  area = Math.abs(area) / 2;

  // Umrechnung von Pixel² zu m²
  const areaInSquareMeters = area / (scale * scale);

  return areaInSquareMeters;
}