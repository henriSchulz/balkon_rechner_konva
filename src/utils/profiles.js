// src/utils/profileCalculator.js
import {
  BODENPROFILE_LAENGEN_MM,
  BODENPROFIL_BREITE_MM,
  RANDABSTAND_MM,
  ZUSCHNITT_TOLERANZ_MM, // NEU: Toleranz importieren
} from "../constants/profiles.js";

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
  return x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);
};

export const calculateProfiles = (
  allPoints,
  wallP1,
  wallP2,
  scale,
  selectedProfile
) => {
  if (allPoints.length < 3) return { profileDetails: [], profileCounts: {} };

  // Die Logik zur Bestimmung der Wandseite und zur Rotation bleibt bestehen.
  const wallVector = [wallP2[0] - wallP1[0], wallP2[1] - wallP1[1]];
  const wallAngle = Math.atan2(wallVector[1], wallVector[0]);
  const rotationAngle = -wallAngle + Math.PI / 2;

  const rotatedPoints = allPoints.map((p) =>
    rotatePoint(p, rotationAngle, wallP1)
  );
  const profilBreitePx = (BODENPROFIL_BREITE_MM[selectedProfile] / 1000) * scale;
  const randabstandPx = (RANDABSTAND_MM / 1000) * scale;

  const profileCounts = {};
  const profileDetails = [];

  // Wichtig: `rotatedEdges` muss alle Kanten enthalten, auch die der Löcher.
  const rotatedEdges = rotatedPoints.map((p, i) => [
    p,
    rotatedPoints[(i + 1) % rotatedPoints.length],
  ]);

  const minY_rot = Math.min(...rotatedPoints.map((p) => p[1]));
  const maxY_rot = Math.max(...rotatedPoints.map((p) => p[1]));

  const totalProfilRows = Math.ceil((maxY_rot - minY_rot) / profilBreitePx);

  // --- NEUE LOGIK START: Hilfsfunktion zur Segmentfindung ---
  // Diese Funktion ermittelt alle horizontalen Segmente (von links nach rechts)
  // für eine gegebene Y-Koordinate.
  const getSegmentsAtY = (y) => {
    const intersections = [];
    for (const edge of rotatedEdges) {
      const [p1, p2] = edge;
      const [y1, y2] = [p1[1], p2[1]];

      // Prüfe, ob die Y-Koordinate die Kante schneidet
      if ((y1 < y && y2 >= y) || (y2 < y && y1 >= y)) {
        intersections.push(x_at_y(p1, p2, y));
      }
    }
    intersections.sort((a, b) => a - b);

    const segments = [];
    for (let j = 0; j < intersections.length; j += 2) {
      if (j + 1 < intersections.length) {
        segments.push({
          min_x: intersections[j],
          max_x: intersections[j + 1],
        });
      }
    }
    return segments;
  };
  // --- NEUE LOGIK ENDE ---

  for (let i = 0; i < totalProfilRows; i++) {
    const y_start_rot = minY_rot + i * profilBreitePx;
    const y_end_rot = y_start_rot + profilBreitePx;
    const y_mid_rot = y_start_rot + profilBreitePx / 2;

    // --- MODIFIZIERTE LOGIK: Finde Segmente an Start, Mitte und Ende ---
    // Wir verwenden die Segmente in der Mitte als Referenz, da dies
    // am stabilsten gegen Eckpunkte ist.
    const segments_mid = getSegmentsAtY(y_mid_rot);
    if (segments_mid.length === 0) continue;

    const segments_start = getSegmentsAtY(y_start_rot);
    const segments_end = getSegmentsAtY(y_end_rot);
    
    // Verarbeite jedes Segment (wichtig für Löcher)
    for (const mid_segment of segments_mid) {
      
      // Finde die überlappenden Segmente am Start und Ende
      const start_segment = segments_start.find(s => 
        Math.max(s.min_x, mid_segment.min_x) < Math.min(s.max_x, mid_segment.max_x)
      );
      const end_segment = segments_end.find(s => 
        Math.max(s.min_x, mid_segment.min_x) < Math.min(s.max_x, mid_segment.max_x)
      );

      // Ermittle die *absolut* minimalen und maximalen X-Werte für dieses
      // Segment über die gesamte Breite der Profilreihe.
      const min_x_segment = Math.min(
          mid_segment.min_x,
          start_segment ? start_segment.min_x : Infinity,
          end_segment ? end_segment.min_x : Infinity
      );
      
      const max_x_segment = Math.max(
          mid_segment.max_x,
          start_segment ? start_segment.max_x : -Infinity,
          end_segment ? end_segment.max_x : -Infinity
      );
      // --- MODIFIZIERTE LOGIK ENDE ---

      const segmentWidthPx = max_x_segment - min_x_segment;

      // Wende Randabstand an
      const requiredLengthPx = segmentWidthPx - 2 * randabstandPx;

      if (requiredLengthPx <= 0) continue;

      // --- MODIFIZIERTE LOGIK: Füge Toleranz hinzu ---
      let requiredLengthMM = (requiredLengthPx / scale) * 1000;
      requiredLengthMM += ZUSCHNITT_TOLERANZ_MM; // 2mm Verschnitt
      
      const laenge =
        BODENPROFILE_LAENGEN_MM.find((l) => l >= requiredLengthMM) ||
        BODENPROFILE_LAENGEN_MM[BODENPROFILE_LAENGEN_MM.length - 1];

      if (laenge) {
        profileCounts[laenge] = (profileCounts[laenge] || 0) + 1;

        const chosenLengthPx = (laenge / 1000) * scale;

        // Die Platzierungslogik muss die *maximalen* Segmentgrenzen verwenden
        const startX_used_rot = min_x_segment + randabstandPx;
        const endX_used_rot = max_x_segment - randabstandPx;
        
        // Profil rechtsbündig (an max_x) ausrichten
        const startX_full_rot = endX_used_rot - chosenLengthPx;

        const corners_full_rot = [
          [startX_full_rot, y_start_rot],
          [endX_used_rot, y_start_rot],
          [endX_used_rot, y_end_rot],
          [startX_full_rot, y_end_rot],
        ];

        const corners_used_rot = [
          [startX_used_rot, y_start_rot],
          [endX_used_rot, y_start_rot],
          [endX_used_rot, y_end_rot],
          [startX_used_rot, y_end_rot],
        ];

        const inverseRotationAngle = -rotationAngle;
        profileDetails.push({
          full: corners_full_rot.map((p) =>
            rotatePoint(p, inverseRotationAngle, wallP1)
          ),
          used: corners_used_rot.map((p) =>
            rotatePoint(p, inverseRotationAngle, wallP1)
          ),
          chosenLengthMM: laenge,
        });
      }
    }
  }

  return { profileDetails, profileCounts };
};