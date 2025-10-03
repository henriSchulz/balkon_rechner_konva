// src/components/profileCalculator.js
export const BODENPROFILE_LAENGEN_MM = [820, 1000, 1200, 1250, 1370, 1500, 1660, 1710, 2000, 2280, 2510, 3010, 3430, 4050, 5050, 6050, 6900];
export const BODENPROFIL_BREITE_MM = 140;

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

  const wallVector = [wallP2[0] - wallP1[0], wallP2[1] - wallP1[1]];
  const wallAngle = Math.atan2(wallVector[1], wallVector[0]);
  const rotationAngle = -wallAngle + Math.PI / 2;

  const rotatedPoints = allPoints.map(p => rotatePoint(p, rotationAngle, wallP1));
  
  // Finde den Index von wallP1 in allPoints
  const wallP1Index = allPoints.findIndex(p => 
    Math.abs(p[0] - wallP1[0]) < 1e-9 && Math.abs(p[1] - wallP1[1]) < 1e-9
  );
  
  const rotatedWallP1 = rotatedPoints[wallP1Index];
  const wallX_rot = rotatedWallP1[0];

  const profilBreitePx = (BODENPROFIL_BREITE_MM / 1000) * scale;
  const profileCounts = {};
  const profileDetails = [];
  
  const rotatedEdges = rotatedPoints.map((p, i) => [p, rotatedPoints[(i + 1) % rotatedPoints.length]]);
  
  const minY_rot = Math.min(...rotatedPoints.map(p => p[1]));
  const maxY_rot = Math.max(...rotatedPoints.map(p => p[1]));
  
  const totalProfilRows = Math.ceil((maxY_rot - minY_rot) / profilBreitePx);

  for (let i = 0; i < totalProfilRows; i++) {
    const y_start_rot = minY_rot + i * profilBreitePx;
    const y_end_rot = y_start_rot + profilBreitePx;
    let min_x_for_profil_rot = Infinity;

    for (const edge of rotatedEdges) {
      let [p1, p2] = edge;
      if (p1[1] > p2[1]) [p1, p2] = [p2, p1];

      // An edge intersects the scan-band if it's not entirely above or entirely below.
      if (p2[1] < y_start_rot || p1[1] > y_end_rot) continue;
      
      const y_clip_start = Math.max(p1[1], y_start_rot);
      const y_clip_end = Math.min(p2[1], y_end_rot);
      
      min_x_for_profil_rot = Math.min(min_x_for_profil_rot, x_at_y(p1, p2, y_clip_start), x_at_y(p1, p2, y_clip_end));
    }

    if (min_x_for_profil_rot === Infinity || min_x_for_profil_rot >= wallX_rot) continue;

    const requiredLengthMM = ((wallX_rot - min_x_for_profil_rot) / scale) * 1000;
    const laenge = BODENPROFILE_LAENGEN_MM.find(l => l >= requiredLengthMM) || BODENPROFILE_LAENGEN_MM[BODENPROFILE_LAENGEN_MM.length - 1];
    
    if (laenge) {
      profileCounts[laenge] = (profileCounts[laenge] || 0) + 1;

      const chosenLengthPx = (laenge / 1000) * scale;
      const requiredLengthPx = (requiredLengthMM / 1000) * scale;
      
      // Definiere die X-Koordinaten für die volle Diele und den genutzten Teil
      const startX_full_rot = wallX_rot - chosenLengthPx;
      const startX_used_rot = wallX_rot - requiredLengthPx;

      // Definiere die 8 Eckpunkte (4 für voll, 4 für genutzt) im rotierten Raum
      const corners_full_rot = [
        [startX_full_rot, y_start_rot],
        [wallX_rot,       y_start_rot],
        [wallX_rot,       y_end_rot],
        [startX_full_rot, y_end_rot],
      ];
      
      const corners_used_rot = [
        [startX_used_rot, y_start_rot],
        [wallX_rot,       y_start_rot],
        [wallX_rot,       y_end_rot],
        [startX_used_rot, y_end_rot],
      ];

      // Rotiere alle 8 Punkte zurück
      const inverseRotationAngle = -rotationAngle;
      profileDetails.push({
          full: corners_full_rot.map(p => rotatePoint(p, inverseRotationAngle, wallP1)),
          used: corners_used_rot.map(p => rotatePoint(p, inverseRotationAngle, wallP1)),
          y: y_start_rot,
          chosenLengthMM: laenge,
      });
    }
  }

  return { profileDetails, profileCounts };
};