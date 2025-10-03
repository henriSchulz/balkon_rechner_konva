// src/components/profileCalculator.js

// Regel III: Korrekte und vollständige Liste der verfügbaren Festlängen
export const BODENPROFILE_LAENGEN_MM = [
    820, 1000, 1200, 1250, 1370, 1500, 1660, 1710, 2000, 2280, 2510, 3010, 3430, 4050, 5050, 6050, 6900
];

// Regel II: Feste Deckbreite des Profils
export const BODENPROFIL_BREITE_MM = 140;

// Regel IV: Zwingend einzuhaltender Randabstand
export const RANDABSTAND_MM = 10;

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

export const calculateProfiles = (allPoints, wallP1, wallP2, scale) => {
  if (allPoints.length < 3) return { profileDetails: [], profileCounts: {} };

  // --- Rotation bleibt gleich: Die Ausrichtung der Dielen wird korrekt gesetzt ---
  const wallVector = [wallP2[0] - wallP1[0], wallP2[1] - wallP1[1]];
  const wallAngle = Math.atan2(wallVector[1], wallVector[0]);
  const rotationAngle = -wallAngle + Math.PI / 2;

  const rotatedPoints = allPoints.map(p => rotatePoint(p, rotationAngle, wallP1));
  const profilBreitePx = (BODENPROFIL_BREITE_MM / 1000) * scale;
  const randabstandPx = (RANDABSTAND_MM / 1000) * scale;
  
  const profileCounts = {};
  const profileDetails = [];
  
  const rotatedEdges = rotatedPoints.map((p, i) => [p, rotatedPoints[(i + 1) % rotatedPoints.length]]);
  
  const minY_rot = Math.min(...rotatedPoints.map(p => p[1]));
  const maxY_rot = Math.max(...rotatedPoints.map(p => p[1]));
  
  const totalProfilRows = Math.ceil((maxY_rot - minY_rot) / profilBreitePx);

  for (let i = 0; i < totalProfilRows; i++) {
    const y_start_rot = minY_rot + i * profilBreitePx;
    const y_end_rot = y_start_rot + profilBreitePx;
    
    // NEUE LOGIK: Finde die tatsächliche MINIMALE und MAXIMALE Ausdehnung des Raumes in dieser Zeile
    let min_x_for_profil_rot = Infinity;
    let max_x_for_profil_rot = -Infinity;

    for (const edge of rotatedEdges) {
      let [p1, p2] = edge;
      if (p1[1] > p2[1]) [p1, p2] = [p2, p1];

      if (p2[1] <= y_start_rot || p1[1] >= y_end_rot) continue;
      
      const y_clip_start = Math.max(p1[1], y_start_rot);
      const y_clip_end = Math.min(p2[1], y_end_rot);
      
      const x_start = x_at_y(p1, p2, y_clip_start);
      const x_end = x_at_y(p1, p2, y_clip_end);

      min_x_for_profil_rot = Math.min(min_x_for_profil_rot, x_start, x_end);
      max_x_for_profil_rot = Math.max(max_x_for_profil_rot, x_start, x_end);
    }

    if (min_x_for_profil_rot === Infinity) continue;

    // NEUE LOGIK: Die benötigte Länge ist der volle Abstand zwischen min und max...
    const totalWidthPx = max_x_for_profil_rot - min_x_for_profil_rot;
    // ...abzüglich des Randabstands an BEIDEN Seiten.
    const requiredLengthPx = totalWidthPx - (2 * randabstandPx);

    if (requiredLengthPx <= 0) continue;

    const requiredLengthMM = (requiredLengthPx / scale) * 1000;
    const laenge = BODENPROFILE_LAENGEN_MM.find(l => l >= requiredLengthMM) || BODENPROFILE_LAENGEN_MM[BODENPROFILE_LAENGEN_MM.length - 1];
    
    if (laenge) {
      profileCounts[laenge] = (profileCounts[laenge] || 0) + 1;

      const chosenLengthPx = (laenge / 1000) * scale;
      
      // NEUE LOGIK: Platziere die Diele basierend auf min/max und den Abständen
      // Annahme: Die Dielen werden rechtsbündig verlegt (Abschnitt links)
      const startX_used_rot = min_x_for_profil_rot + randabstandPx;
      const endX_used_rot = max_x_for_profil_rot - randabstandPx;
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

  return { profileDetails, profileCounts };
};