// src/utils/profileCalculator.js
import { BODENPROFILE_LAENGEN_MM, BODENPROFIL_BREITE_MM, RANDABSTAND_MM } from '../constants/profiles.js';

// Die Hilfsfunktionen rotatePoint und x_at_y bleiben unverändert.
const rotatePoint = (point, angle, origin) => {
    const [px, py] = point;
    const [ox, oy] = origin;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const x = (px - ox) * cosA - (py - oy) * sinA + ox;
    const y = (px - ox) * sinA + (py - oy) * cosA + oy;
    return [x, y];
};

const x_at_y = (p1, p2, y) => {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  if (Math.abs(y1 - y2) < 1e-9) return Math.min(x1, x2);
  return x1 + (x2 - x1) * (y - y1) / (y2 - y1);
};

export const calculateProfiles = (allPoints, wallP1, wallP2, scale, selectedProfile) => {
  if (allPoints.length < 3) return { profileDetails: [], profileCounts: {} };

  // Die Logik zur Bestimmung der Wandseite und zur Rotation bleibt bestehen.
  const wallVector = [wallP2[0] - wallP1[0], wallP2[1] - wallP1[1]];
  const wallAngle = Math.atan2(wallVector[1], wallVector[0]);
  const rotationAngle = -wallAngle + Math.PI / 2;

  const rotatedPoints = allPoints.map(p => rotatePoint(p, rotationAngle, wallP1));
  const profilBreitePx = (BODENPROFIL_BREITE_MM[selectedProfile] / 1000) * scale;
  const randabstandPx = (RANDABSTAND_MM / 1000) * scale;
  
  const profileCounts = {};
  const profileDetails = [];
  
  // Wichtig: `rotatedEdges` muss alle Kanten enthalten, auch die der Löcher.
  const rotatedEdges = rotatedPoints.map((p, i) => [p, rotatedPoints[(i + 1) % rotatedPoints.length]]);
  
  const minY_rot = Math.min(...rotatedPoints.map(p => p[1]));
  const maxY_rot = Math.max(...rotatedPoints.map(p => p[1]));
  
  const totalProfilRows = Math.ceil((maxY_rot - minY_rot) / profilBreitePx);

  for (let i = 0; i < totalProfilRows; i++) {
    const y_start_rot = minY_rot + i * profilBreitePx;
    const y_end_rot = y_start_rot + profilBreitePx;
    
    // --- NEUE LOGIK: Finde alle Segmente pro Zeile ---
    const y_row_center = y_start_rot + profilBreitePx / 2;
    const x_intersections = [];

    // 1. Finde alle Schnittpunkte der Raumkanten mit der aktuellen Dielen-Reihe
    for (const edge of rotatedEdges) {
        const [p1, p2] = edge;
        const [y1, y2] = [p1[1], p2[1]];

        if ((y1 <= y_row_center && y2 > y_row_center) || (y2 <= y_row_center && y1 > y_row_center)) {
            const x = x_at_y(p1, p2, y_row_center);
            x_intersections.push(x);
        }
    }

    // 2. Sortiere die Schnittpunkte von links nach rechts
    x_intersections.sort((a, b) => a - b);

    // 3. Verarbeite die Schnittpunkte paarweise. Jedes Paar (z.B. 0-1, 2-3) ist ein Segment, das Dielen benötigt.
    for (let j = 0; j < x_intersections.length; j += 2) {
        if (j + 1 >= x_intersections.length) continue; // Sollte bei validen Polygonen nicht vorkommen

        const min_x_segment = x_intersections[j];
        const max_x_segment = x_intersections[j + 1];

        // --- Wende die Berechnungslogik nun auf jedes einzelne Segment an ---
        const segmentWidthPx = max_x_segment - min_x_segment;
        
        // Für eine robuste Lösung bei Löchern wird der Randabstand an BEIDEN Seiten des Segments angewendet.
        // Dies stellt sicher, dass auch an den Kanten des Ausschnitts ein korrekter Abstand bleibt.
        const requiredLengthPx = segmentWidthPx - (2 * randabstandPx);

        if (requiredLengthPx <= 0) continue;

        const requiredLengthMM = (requiredLengthPx / scale) * 1000;
        const laenge = BODENPROFILE_LAENGEN_MM.find(l => l >= requiredLengthMM) || BODENPROFILE_LAENGEN_MM[BODENPROFILE_LAENGEN_MM.length - 1];
        
        if (laenge) {
          profileCounts[laenge] = (profileCounts[laenge] || 0) + 1;

          const chosenLengthPx = (laenge / 1000) * scale;
          
          // Wir verwenden hier eine konsistente Platzierungsstrategie (z.B. rechtsbündig wie im Original).
          // Der Überstand ist nun innerhalb des Segments.
          const startX_used_rot = min_x_segment + randabstandPx;
          const endX_used_rot = max_x_segment - randabstandPx;
          const startX_full_rot = endX_used_rot - chosenLengthPx;

          const corners_full_rot = [
            [startX_full_rot, y_start_rot], [endX_used_rot, y_start_rot],
            [endX_used_rot, y_end_rot], [startX_full_rot, y_end_rot],
          ];
          
          const corners_used_rot = [
            [startX_used_rot, y_start_rot], [endX_used_rot, y_start_rot],
            [endX_used_rot, y_end_rot], [startX_used_rot, y_end_rot],
          ];

          const inverseRotationAngle = -rotationAngle;
          profileDetails.push({
              full: corners_full_rot.map(p => rotatePoint(p, inverseRotationAngle, wallP1)),
              used: corners_used_rot.map(p => rotatePoint(p, inverseRotationAngle, wallP1)),
              chosenLengthMM: laenge,
          });
        }
    }
  }

  return { profileDetails, profileCounts };
};