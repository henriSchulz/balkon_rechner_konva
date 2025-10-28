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

export const projectPointOnLine = (point, lineStart, lineEnd) => {
    const L2 = (lineEnd.x - lineStart.x) ** 2 + (lineEnd.y - lineStart.y) ** 2;
    if (L2 === 0) return lineStart;
    const t = ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / L2;
    return {
        x: lineStart.x + t * (lineEnd.x - lineStart.x),
        y: lineStart.y + t * (lineEnd.y - lineStart.y),
    };
};

export const getPointOnCircle = (point, center, radius) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: center.x + radius, y: center.y };
    return {
        x: center.x + (dx / dist) * radius,
        y: center.y + (dy / dist) * radius,
    };
};

export const circleCircleIntersection = (c1, r1, c2, r2) => {
    const d = getDistance(c1, c2);

    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
        return []; // No intersection or concentric
    }

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
    const x2 = c1.x + a * (c2.x - c1.x) / d;
    const y2 = c1.y + a * (c2.y - c1.y) / d;

    const p1 = {
        x: x2 + h * (c2.y - c1.y) / d,
        y: y2 - h * (c2.x - c1.x) / d,
    };
    const p2 = {
        x: x2 - h * (c2.y - c1.y) / d,
        y: y2 + h * (c2.x - c1.x) / d,
    };

    return [p1, p2];
};

export const lineCircleIntersection = (lineP1, lineP2, circleCenter, radius) => {
    const dx = lineP2.x - lineP1.x;
    const dy = lineP2.y - lineP1.y;
    const A = dx * dx + dy * dy;
    const B = 2 * (dx * (lineP1.x - circleCenter.x) + dy * (lineP1.y - circleCenter.y));
    const C = (lineP1.x - circleCenter.x) ** 2 + (lineP1.y - circleCenter.y) ** 2 - radius ** 2;

    const det = B * B - 4 * A * C;
    const intersections = [];

    if (A <= 0.0000001 || det < 0) {
        return intersections; // No real solutions
    } else if (det === 0) {
        const t = -B / (2 * A);
        intersections.push({ x: lineP1.x + t * dx, y: lineP1.y + t * dy });
    } else {
        const t1 = (-B + Math.sqrt(det)) / (2 * A);
        const t2 = (-B - Math.sqrt(det)) / (2 * A);
        intersections.push({ x: lineP1.x + t1 * dx, y: lineP1.y + t1 * dy });
        intersections.push({ x: lineP1.x + t2 * dx, y: lineP1.y + t2 * dy });
    }
    return intersections;
};

export const lineLineIntersection = (l1p1, l1p2, l2p1, l2p2) => {
    const d = (l1p1.x - l1p2.x) * (l2p1.y - l2p2.y) - (l1p1.y - l1p2.y) * (l2p1.x - l2p2.x);
    if (d === 0) {
        return null; // Parallel lines
    }
    const t = ((l1p1.x - l2p1.x) * (l2p1.y - l2p2.y) - (l1p1.y - l2p1.y) * (l2p1.x - l2p2.x)) / d;
    return {
        x: l1p1.x + t * (l1p2.x - l1p1.x),
        y: l1p1.y + t * (l1p2.y - l1p1.y),
    };
};