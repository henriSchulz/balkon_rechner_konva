import { useState } from 'react';
import { Stage, Layer, Circle, Line, Text, Group, Rect } from 'react-konva';

const GRID_SIZE = 50;
const CANVAS_SIZE = 700;
const DEFAULT_SCALE = 50; // 1 Meter = 50 Pixel
const SNAP_THRESHOLD_PX = 6;
const ANGLE_SNAP_THRESHOLD_DEG = 4;


function getAngle(p0, p1, p2) {
  const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
  const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  const angleRad = Math.acos(dot / (mag1 * mag2));
  return Math.round((angleRad * 180) / Math.PI);
}

// Hilfsfunktionen für Maßstab
function pixelsToMeters(pixels, scale) {
  return (pixels / scale).toFixed(2);
}

function metersToPixels(meters, scale) {
  return meters * scale;
}

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

const CanvasComponent = () => {
  const [points, setPoints] = useState([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState(null);
  const [hauswandEdges, setHauswandEdges] = useState([]);
  const [scale, setScale] = useState(DEFAULT_SCALE); // Pixel pro Meter
  const [showLengths, setShowLengths] = useState(true);
  const [editingEdge, setEditingEdge] = useState(null); // Index der zu bearbeitenden Kante
  const [editingLength, setEditingLength] = useState(''); // Eingabefeld für neue Länge
  const [lockedEdges, setLockedEdges] = useState(new Set()); // Set der gesperrten Kanten
  const [editingAngle, setEditingAngle] = useState(null); // Index des zu bearbeitenden Winkels
  const [editingAngleValue, setEditingAngleValue] = useState(''); // Eingabefeld für neuen Winkel
  const [lockedAngles, setLockedAngles] = useState(new Set()); // Set der gesperrten Winkel
  const [errorMessage, setErrorMessage] = useState(''); // Fehlermeldung für gesperrte Kanten/Winkel
  const [cursorPos, setCursorPos] = useState(null);
  const [snapLines, setSnapLines] = useState([]);

  const getSnappedPos = (pos, allPoints, lastPoint) => {
    let snappedPos = { ...pos };
    const newSnapLines = [];

    // Snap zu anderen Punkten (höchste Priorität)
    for (const otherPoint of allPoints) {
      if (getDistance(snappedPos, otherPoint) < SNAP_THRESHOLD_PX * 2) {
        snappedPos = { ...otherPoint };
        newSnapLines.push({ type: 'point', points: [snappedPos.x - 5, snappedPos.y, snappedPos.x + 5, snappedPos.y] });
        newSnapLines.push({ type: 'point', points: [snappedPos.x, snappedPos.y - 5, snappedPos.x, snappedPos.y + 5] });
        setSnapLines(newSnapLines);
        return snappedPos; // Frühzeitige Rückkehr, da Punktsnap am wichtigsten ist
      }
    }

    // Achsen-Snap
    for (const otherPoint of allPoints) {
      if (Math.abs(snappedPos.x - otherPoint.x) < SNAP_THRESHOLD_PX) {
        snappedPos.x = otherPoint.x;
        newSnapLines.push({ type: 'axis', points: [otherPoint.x, 0, otherPoint.x, CANVAS_SIZE] });
      }
      if (Math.abs(snappedPos.y - otherPoint.y) < SNAP_THRESHOLD_PX) {
        snappedPos.y = otherPoint.y;
        newSnapLines.push({ type: 'axis', points: [0, otherPoint.y, CANVAS_SIZE, otherPoint.y] });
      }
    }

    // Winkel-Snap
    if (lastPoint) {
      const angle = (Math.atan2(snappedPos.y - lastPoint.y, snappedPos.x - lastPoint.x) * 180) / Math.PI;
      const distance = getDistance(lastPoint, snappedPos);

      for (let snapAngle = 0; snapAngle <= 360; snapAngle += 45) {
        if (Math.abs(angle - snapAngle) < ANGLE_SNAP_THRESHOLD_DEG) {
          const newAngleRad = (snapAngle * Math.PI) / 180;
          snappedPos.x = lastPoint.x + Math.cos(newAngleRad) * distance;
          snappedPos.y = lastPoint.y + Math.sin(newAngleRad) * distance;
          newSnapLines.push({ type: 'angle', points: [lastPoint.x, lastPoint.y, snappedPos.x, snappedPos.y] });
          break; // Nur zum ersten passenden Winkel snappen
        }
      }
    }

    // Snap zum Grid
    const nearestGridX = Math.round(snappedPos.x / scale) * scale;
    const nearestGridY = Math.round(snappedPos.y / scale) * scale;

    if (getDistance(snappedPos, { x: nearestGridX, y: nearestGridY }) < SNAP_THRESHOLD_PX) {
      snappedPos = { x: nearestGridX, y: nearestGridY };
    }

    setSnapLines(newSnapLines);
    return snappedPos;
  };

  const handleStageClick = (e) => {
    if (e.target.getStage() !== e.target) return;

    const stage = e.target.getStage();
    let pos = stage.getPointerPosition();

    if (snapEnabled) {
      const lastPoint = points.length > 0 ? points[points.length - 1] : null;
      pos = getSnappedPos(pos, points, lastPoint);
    }

    setPoints([...points, pos]);
  };

  const handleHauswandSetzen = (edgeIndex) => {
    // Nur eine Hauswand erlauben - ersetze die vorherige
    setHauswandEdges([edgeIndex]);
    setHoveredEdgeIndex(null);
  };

  const handleLengthClick = (edgeIndex, currentLength) => {
    setEditingEdge(edgeIndex);
    setEditingLength(currentLength);
  };

  const handleAngleClick = (angleIndex, currentAngle) => {
    setEditingAngle(angleIndex);
    setEditingAngleValue(currentAngle);
  };

  const handleLengthChange = (newLength) => {
    if (editingEdge === null || !newLength || isNaN(newLength)) return;
    
    const edgeIndex = editingEdge;
    const point1Index = edgeIndex;
    const point2Index = (edgeIndex + 1) % points.length;
    const point1 = points[point1Index];
    const point2 = points[point2Index];
    
    // Finde angrenzende Kanten
    const prevEdgeIndex = (edgeIndex - 1 + points.length) % points.length;
    const nextEdgeIndex = (edgeIndex + 1) % points.length;
    
    const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
    const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);
    
    // Berechne die aktuelle Länge in Pixeln
    const currentDistance = getDistance(point1, point2);
    const newDistancePixels = metersToPixels(parseFloat(newLength), scale);
    
    // Berechne die Richtung der Kante
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);
    
    // Normalisiere die Richtung
    const unitX = dx / currentLength;
    const unitY = dy / currentLength;
    
    const newPoints = [...points];
    
    // Strategie basierend auf gesperrten angrenzenden Kanten
    if (isPrevEdgeLocked && isNextEdgeLocked) {
      // Beide angrenzende Kanten sind gesperrt - Bewegung nicht möglich
      setErrorMessage('Kante kann nicht bearbeitet werden - beide angrenzenden Kanten sind gesperrt!');
      setTimeout(() => setErrorMessage(''), 3000);
      setEditingEdge(null);
      setEditingLength('');
      return;
    } else if (isPrevEdgeLocked) {
      // Vorherige Kante ist gesperrt - nur point2 bewegen
      newPoints[point2Index] = {
        x: point1.x + unitX * newDistancePixels,
        y: point1.y + unitY * newDistancePixels
      };
    } else if (isNextEdgeLocked) {
      // Nächste Kante ist gesperrt - nur point1 bewegen
      newPoints[point1Index] = {
        x: point2.x - unitX * newDistancePixels,
        y: point2.y - unitY * newDistancePixels
      };
    } else {
      // Keine angrenzenden Kanten sind gesperrt - beide Punkte proportional bewegen
      const lengthDifference = newDistancePixels - currentDistance;
      const moveDistance = lengthDifference / 2;
      
      newPoints[point1Index] = {
        x: point1.x - unitX * moveDistance,
        y: point1.y - unitY * moveDistance
      };
      
      newPoints[point2Index] = {
        x: point2.x + unitX * moveDistance,
        y: point2.y + unitY * moveDistance
      };
    }
    
    setPoints(newPoints);
    
    // Sperre diese Kante
    setLockedEdges(prev => new Set([...prev, edgeIndex]));
    
    // Beende die Bearbeitung
    setEditingEdge(null);
    setEditingLength('');
  };

  const handleAngleChange = (newAngle) => {
    if (editingAngle === null || !newAngle || isNaN(newAngle)) return;
    
    const angleIndex = editingAngle;
    const angleValue = parseFloat(newAngle);
    
    // Winkel muss zwischen 1 und 179 Grad liegen (keine 0° oder 180°)
    if (angleValue <= 0 || angleValue >= 180) {
      setErrorMessage('Winkel muss zwischen 1° und 179° liegen!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    // Finde die beiden angrenzenden Kanten des Winkels
    const prevEdgeIndex = (angleIndex - 1 + points.length) % points.length;
    const nextEdgeIndex = angleIndex;
    
    const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
    const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);
    
    // Prüfe ob beide angrenzende Kanten gesperrt sind
    if (isPrevEdgeLocked && isNextEdgeLocked) {
      setErrorMessage('Winkel kann nicht bearbeitet werden - beide angrenzenden Kanten sind gesperrt!');
      setTimeout(() => setErrorMessage(''), 3000);
      setEditingAngle(null);
      setEditingAngleValue('');
      return;
    }
    
    const newPoints = [...points];
    const currentPoint = points[angleIndex];
    const prevPoint = points[(angleIndex - 1 + points.length) % points.length];
    const nextPoint = points[(angleIndex + 1) % points.length];
    
    // Berechne die aktuellen Vektoren
    const v1 = { x: prevPoint.x - currentPoint.x, y: prevPoint.y - currentPoint.y };
    const v2 = { x: nextPoint.x - currentPoint.x, y: nextPoint.y - currentPoint.y };
    
    // Berechne die Längen der Vektoren
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    // Berechne den aktuellen Winkel zwischen den Vektoren
    const currentAngle = getAngle(prevPoint, currentPoint, nextPoint);
    const angleDifference = angleValue - currentAngle;
    
    // Berechne die Rotation, die angewendet werden muss
    const rotationRad = (angleDifference * Math.PI) / 180;
    
    if (isPrevEdgeLocked) {
      // Vorherige Kante ist gesperrt - nur nextPoint bewegen
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);
      
      // Rotiere v2 um den gewünschten Winkel
      const newV2x = v2.x * cos - v2.y * sin;
      const newV2y = v2.x * sin + v2.y * cos;
      
      newPoints[(angleIndex + 1) % points.length] = {
        x: currentPoint.x + newV2x,
        y: currentPoint.y + newV2y
      };
    } else if (isNextEdgeLocked) {
      // Nächste Kante ist gesperrt - nur prevPoint bewegen
      const cos = Math.cos(-rotationRad);
      const sin = Math.sin(-rotationRad);
      
      // Rotiere v1 um den gewünschten Winkel (in entgegengesetzte Richtung)
      const newV1x = v1.x * cos - v1.y * sin;
      const newV1y = v1.x * sin + v1.y * cos;
      
      newPoints[(angleIndex - 1 + points.length) % points.length] = {
        x: currentPoint.x + newV1x,
        y: currentPoint.y + newV1y
      };
    } else {
      // Keine Kanten sind gesperrt - beide Punkte proportional bewegen
      const halfRotation = rotationRad / 2;
      
      // Rotiere v1 um die halbe gewünschte Rotation
      const cos1 = Math.cos(-halfRotation);
      const sin1 = Math.sin(-halfRotation);
      const newV1x = v1.x * cos1 - v1.y * sin1;
      const newV1y = v1.x * sin1 + v1.y * cos1;
      
      // Rotiere v2 um die halbe gewünschte Rotation
      const cos2 = Math.cos(halfRotation);
      const sin2 = Math.sin(halfRotation);
      const newV2x = v2.x * cos2 - v2.y * sin2;
      const newV2y = v2.x * sin2 + v2.y * cos2;
      
      newPoints[(angleIndex - 1 + points.length) % points.length] = {
        x: currentPoint.x + newV1x,
        y: currentPoint.y + newV1y
      };
      
      newPoints[(angleIndex + 1) % points.length] = {
        x: currentPoint.x + newV2x,
        y: currentPoint.y + newV2y
      };
    }
    
    setPoints(newPoints);
    
    // Sperre diesen Winkel
    setLockedAngles(prev => new Set([...prev, angleIndex]));
    
    // Beende die Bearbeitung
    setEditingAngle(null);
    setEditingAngleValue('');
  };

  const handleAngleCancel = () => {
    setEditingAngle(null);
    setEditingAngleValue('');
  };

  const handleLengthCancel = () => {
    setEditingEdge(null);
    setEditingLength('');
  };

  const handleUnlockEdge = (edgeIndex) => {
    setLockedEdges(prev => {
      const newSet = new Set(prev);
      newSet.delete(edgeIndex);
      return newSet;
    });
  };

  const handleUnlockAngle = (angleIndex) => {
    setLockedAngles(prev => {
      const newSet = new Set(prev);
      newSet.delete(angleIndex);
      return newSet;
    });
  };

  const handleDragMove = (e, idx) => {
    let newPos = e.target.position();

    if (snapEnabled) {
      const otherPoints = points.filter((_, i) => i !== idx);
      const lastPoint = points.length > 1 ? points[idx === 0 ? points.length - 1 : idx - 1] : null;
      newPos = getSnappedPos(newPos, otherPoints, lastPoint);
    }
      
    if (lockedEdges.size > 0 || lockedAngles.size > 0) {
      const dx = newPos.x - points[idx].x;
      const dy = newPos.y - points[idx].y;
      setPoints(points.map(p => ({ x: p.x + dx, y: p.y + dy })));
    } else {
      setPoints(points.map((point, i) => (i === idx ? newPos : point)));
    }
  };

  const linePoints = points.flatMap(point => [point.x, point.y]);

  // Grid-Linien vorbereiten - angepasst an den aktuellen Maßstab
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

  // Winkel berechnen
  const angles = points.length > 2
    ? points.map((p, i, arr) => {
        const prev = arr[(i - 1 + arr.length) % arr.length];
        const next = arr[(i + 1) % arr.length];
        return getAngle(prev, p, next);
      })
    : [];

  return (
    <div style={{ position: 'relative' }}>
      {/* Kontrollpanel */}
      <div style={{ 
        marginBottom: '10px', 
        padding: '10px', 
        border: '1px solid #ccc', 
        borderRadius: '5px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>
            Maßstab (Pixel pro Meter):
            <input 
              type="number" 
              value={scale} 
              onChange={(e) => setScale(Number(e.target.value))}
              min="10"
              max="200"
              step="5"
              style={{ marginLeft: '5px', width: '80px' }}
            />
          </label>
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            (Aktuell: 1m = {scale}px, Grid = 1m)
          </span>
        </div>
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={showLengths} 
              onChange={(e) => setShowLengths(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Längen anzeigen
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input 
              type="checkbox" 
              checked={snapEnabled} 
              onChange={(e) => setSnapEnabled(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Snap aktiviert
          </label>
          <button
            onClick={() => setLockedEdges(new Set())}
            style={{
              marginLeft: '20px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={lockedEdges.size === 0}
          >
            Alle Kanten-Sperren aufheben ({lockedEdges.size})
          </button>
          <button
            onClick={() => setLockedAngles(new Set())}
            style={{
              marginLeft: '10px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={lockedAngles.size === 0}
          >
            Alle Winkel-Sperren aufheben ({lockedAngles.size})
          </button>
        </div>
        {/* Informationstext */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          💡 Tipp: Klicken Sie auf die Längenangaben oder Winkel, um sie zu bearbeiten. Bearbeitete Werte werden automatisch gesperrt (🔒).
          <br />
          Gesperrte Kanten/Winkel (🔒) können durch erneutes Klicken entsperrt werden. Werte mit 🚫 können nicht bearbeitet werden (Konflikte mit anderen Sperren).
          <br />
          🏠 Hauswand: Klicken Sie auf eine Kante, um sie als Hauswand zu setzen (rot) oder zu entfernen.
        </div>
      </div>
      
      {/* Fehlermeldung */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '10px',
          color: '#d32f2f',
          fontWeight: 'bold'
        }}>
          ⚠️ {errorMessage}
        </div>
      )}
      
      {/* Längen-Bearbeitungsfeld */}
      {editingEdge !== null && (
        <div style={{
          position: 'absolute',
          top: '150px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          border: '2px solid green',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            Neue Länge eingeben:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number"
              value={editingLength}
              onChange={(e) => setEditingLength(e.target.value)}
              step="0.1"
              min="0.1"
              style={{
                padding: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '80px'
              }}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLengthChange(editingLength);
                } else if (e.key === 'Escape') {
                  handleLengthCancel();
                }
              }}
            />
            <span>m</span>
            <button
              onClick={() => handleLengthChange(editingLength)}
              style={{
                backgroundColor: 'green',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
            <button
              onClick={handleLengthCancel}
              style={{
                backgroundColor: '#ccc',
                color: 'black',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
      
      {/* Winkel-Bearbeitungsfeld */}
      {editingAngle !== null && (
        <div style={{
          position: 'absolute',
          top: '150px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          border: '2px solid purple',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            Neuen Winkel eingeben:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number"
              value={editingAngleValue}
              onChange={(e) => setEditingAngleValue(e.target.value)}
              step="1"
              min="1"
              max="179"
              style={{
                padding: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '80px'
              }}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAngleChange(editingAngleValue);
                } else if (e.key === 'Escape') {
                  handleAngleCancel();
                }
              }}
            />
            <span>°</span>
            <button
              onClick={() => handleAngleChange(editingAngleValue)}
              style={{
                backgroundColor: 'purple',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
            <button
              onClick={handleAngleCancel}
              style={{
                backgroundColor: '#ccc',
                color: 'black',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
      
      <Stage
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: '1px solid black', height: '700px', width: '700px' }}
        onMouseDown={handleStageClick}
        onMouseMove={(e) => {
          const stage = e.target.getStage();
          let pos = stage.getPointerPosition();
          if (snapEnabled && points.length > 0) {
            const lastPoint = points[points.length - 1];
            pos = getSnappedPos(pos, points, lastPoint);
          } else {
            setSnapLines([]); // Clear snap lines if not snapping
          }
          setCursorPos(pos);
        }}
        onMouseLeave={() => {
          setCursorPos(null);
          setSnapLines([]); // Clear snap lines on leave
        }}
      >
      <Layer>
        {gridLines}
      </Layer>
      <Layer>
        {points.length > 1 && (
          <>
            {/* Füllung */}
            <Line
              points={linePoints}
              closed={true}
              stroke="transparent"
              strokeWidth={0}
              fill="rgba(0,0,255,0.1)"
            />
            {/* Einzelne Kanten für Hover-Effekt */}
            {points.map((point, i) => {
              const nextPoint = points[(i + 1) % points.length];
              const isHovered = hoveredEdgeIndex === i;
              const isHauswand = hauswandEdges.includes(i);
              const isLocked = lockedEdges.has(i);
              const midX = (point.x + nextPoint.x) / 2;
              const midY = (point.y + nextPoint.y) / 2;
              const distance = getDistance(point, nextPoint);
              const lengthInMeters = pixelsToMeters(distance, scale);
              
              // Berechne den Winkel der Linie für die Textausrichtung
              const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
              const degrees = (angle * 180) / Math.PI;
              
              // Normalisiere den Winkel, damit Text immer lesbar ist (nicht auf dem Kopf)
              const normalizedAngle = degrees > 90 || degrees < -90 ? degrees + 180 : degrees;
              
              // Berechne Position parallel zur Kante, aber leicht versetzt
              const offsetDistance = 15; // Abstand zur Kante
              const perpAngle = angle + Math.PI / 2; // 90 Grad gedreht für senkrechten Offset
              const textX = midX + Math.cos(perpAngle) * offsetDistance;
              const textY = midY + Math.sin(perpAngle) * offsetDistance;
              
              // Prüfe, ob diese Kante bearbeitbar ist (nicht beide angrenzenden Kanten gesperrt)
              const prevEdgeIndex = (i - 1 + points.length) % points.length;
              const nextEdgeIndex = (i + 1) % points.length;
              const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
              const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);
              const isEditable = !isLocked && !(isPrevEdgeLocked && isNextEdgeLocked);
              
              return (
                <Group key={`edge-group-${i}`}>
                  {/* Sichtbare Linie */}
                  <Line
                    key={`edge-${i}`}
                    points={[point.x, point.y, nextPoint.x, nextPoint.y]}
                    stroke={isHauswand ? "#e53e3e" : (isHovered ? "#FF9500" : "#2563eb")}
                    strokeWidth={isHauswand ? 6 : (isHovered ? 5 : 4)}
                    lineCap="round"
                    lineJoin="round"
                  />
                  {/* Längenanzeige parallel zur Kante, aber versetzt */}
                  {showLengths && (
                    <Group
                      x={textX}
                      y={textY}
                      rotation={normalizedAngle}
                    >
                      {/* Schatten für Tiefe */}
                      <Rect
                        x={-22}
                        y={-7}
                        width={44}
                        height={14}
                        fill="rgba(0,0,0,0.1)"
                        cornerRadius={7}
                        offsetX={1}
                        offsetY={1}
                      />
                      {/* Haupthintergrund */}
                      <Rect
                        x={-22}
                        y={-7}
                        width={44}
                        height={14}
                        fill={isLocked ? "rgba(220,220,220,0.95)" : (!isEditable ? "rgba(255,100,100,0.95)" : "rgba(255,255,255,0.95)")}
                        stroke={isLocked ? "#999" : (!isEditable ? "#ff4444" : "#4CAF50")}
                        strokeWidth={1}
                        cornerRadius={7}
                        onClick={(e) => {
                          e.evt.stopPropagation();
                          if (isLocked) {
                            handleUnlockEdge(i);
                          } else if (isEditable) {
                            handleLengthClick(i, lengthInMeters);
                          }
                        }}
                      />
                      <Text
                        x={0}
                        y={0}
                        text={isLocked ? `🔒${lengthInMeters}m` : (!isEditable ? `🚫${lengthInMeters}m` : `${lengthInMeters}m`)}
                        fontSize={10}
                        fill={isLocked ? "#666" : (!isEditable ? "white" : "#333")}
                        fontFamily="Arial, sans-serif"
                        fontStyle="normal"
                        offsetX={isLocked ? 22 : (!isEditable ? 22 : 18)}
                        offsetY={5}
                        onClick={(e) => {
                          e.evt.stopPropagation();
                          if (isLocked) {
                            handleUnlockEdge(i);
                          } else if (isEditable) {
                            handleLengthClick(i, lengthInMeters);
                          }
                        }}
                      />
                    </Group>
                  )}
                  {/* Unsichtbarer, dickerer Hover-Bereich */}
                  <Line
                    key={`hover-area-${i}`}
                    points={[point.x, point.y, nextPoint.x, nextPoint.y]}
                    stroke="transparent"
                    strokeWidth={20}
                    onMouseEnter={() => setHoveredEdgeIndex(i)}
                    onMouseLeave={() => setHoveredEdgeIndex(null)}
                    onClick={() => {
                      if (isHauswand) {
                        // Hauswand entfernen
                        setHauswandEdges([]);
                      } else {
                        // Hauswand setzen
                        handleHauswandSetzen(i);
                      }
                    }}
                  />
                </Group>
              );
            })}
          </>
        )}
        {/* Snap-Hilfslinien */}
        {snapLines.map((line, i) => (
          <Line
            key={`snap-line-${i}`}
            points={line.points}
            stroke={line.type === 'axis' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)'}
            strokeWidth={1}
            dash={line.type === 'axis' ? [4, 4] : [2, 2]}
          />
        ))}

        {/* Smart Guides - Vorschau für die nächste Linie */}
        {cursorPos && points.length > 0 && (
          <Group>
            {(() => {
              const lastPoint = points[points.length - 1];
              const distance = getDistance(lastPoint, cursorPos);
              const lengthInMeters = pixelsToMeters(distance, scale);
              const angle = Math.atan2(cursorPos.y - lastPoint.y, cursorPos.x - lastPoint.x);
              const degrees = (angle * 180) / Math.PI;

              return (
                <>
                  <Line
                    points={[lastPoint.x, lastPoint.y, cursorPos.x, cursorPos.y]}
                    stroke="#4CAF50"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                  <Text
                    x={cursorPos.x + 10}
                    y={cursorPos.y}
                    text={`${lengthInMeters} m / ${degrees.toFixed(1)}°`}
                    fontSize={12}
                    fill="#333"
                    padding={4}
                    backgroundColor="rgba(255, 255, 255, 0.75)"
                    cornerRadius={4}
                  />
                </>
              );
            })()}
          </Group>
        )}

        {points.map((point, i) => (
          <Group key={`point-group-${i}`}>
            {/* Schatten für Punkte */}
            <Circle
              x={point.x + 1}
              y={point.y + 1}
              radius={6}
              fill="rgba(0,0,0,0.2)"
            />
            {/* Hauptpunkt */}
            <Circle
              x={point.x}
              y={point.y}
              radius={6}
              fill="#2563eb"
              stroke="white"
              strokeWidth={2}
              draggable
              onDragMove={e => handleDragMove(e, i)}
            />
            {angles[i] !== undefined && (
              <Group>
                {/* Prüfe, ob dieser Winkel bearbeitbar ist */}
                {(() => {
                  const prevEdgeIndex = (i - 1 + points.length) % points.length;
                  const nextEdgeIndex = i;
                  const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
                  const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);
                  const isAngleLocked = lockedAngles.has(i);
                  const isAngleEditable = !isAngleLocked && !(isPrevEdgeLocked && isNextEdgeLocked);
                  
                  return (
                    <>
                      {/* Hintergrund für Winkeltext */}
                      <Rect
                        x={point.x + 5}
                        y={point.y - 25}
                        width={40}
                        height={16}
                        fill={isAngleLocked ? "rgba(220,220,220,0.95)" : (!isAngleEditable ? "rgba(255,100,100,0.95)" : "rgba(255,255,255,0.95)")}
                        stroke={isAngleLocked ? "#999" : (!isAngleEditable ? "#ff4444" : "#9c27b0")}
                        strokeWidth={1}
                        cornerRadius={5}
                        onClick={(e) => {
                          e.evt.stopPropagation();
                          if (isAngleLocked) {
                            handleUnlockAngle(i);
                          } else if (isAngleEditable) {
                            handleAngleClick(i, angles[i]);
                          }
                        }}
                      />
                      {/* Schatten für Winkeltext */}
                      <Text
                        x={point.x + 26}
                        y={point.y - 19}
                        text={isAngleLocked ? `🔒${angles[i]}°` : (!isAngleEditable ? `🚫${angles[i]}°` : `${angles[i]}°`)}
                        fontSize={10}
                        fill="rgba(0,0,0,0.3)"
                        fontFamily="Arial, sans-serif"
                        offsetX={isAngleLocked ? 20 : (!isAngleEditable ? 20 : 15)}
                        offsetY={5}
                      />
                      {/* Winkeltext */}
                      <Text
                        x={point.x + 25}
                        y={point.y - 20}
                        text={isAngleLocked ? `🔒${angles[i]}°` : (!isAngleEditable ? `🚫${angles[i]}°` : `${angles[i]}°`)}
                        fontSize={10}
                        fill={isAngleLocked ? "#666" : (!isAngleEditable ? "white" : "#9c27b0")}
                        fontFamily="Arial, sans-serif"
                        fontStyle="bold"
                        offsetX={isAngleLocked ? 20 : (!isAngleEditable ? 20 : 15)}
                        offsetY={5}
                        onClick={(e) => {
                          e.evt.stopPropagation();
                          if (isAngleLocked) {
                            handleUnlockAngle(i);
                          } else if (isAngleEditable) {
                            handleAngleClick(i, angles[i]);
                          }
                        }}
                      />
                    </>
                  );
                })()}
              </Group>
            )}
          </Group>
        ))}
      </Layer>
    </Stage>
    </div>
  );
};

export default CanvasComponent;