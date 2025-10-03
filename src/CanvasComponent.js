import { useState } from 'react';
import { Stage, Layer, Circle, Line, Text, Group, Rect } from 'react-konva';

const GRID_SIZE = 50;
const CANVAS_SIZE = 700;
const DEFAULT_SCALE = 50; // 1 Meter = 50 Pixel
const SNAP_THRESHOLD_PX = 6;


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
  const [errorMessage, setErrorMessage] = useState(''); // Fehlermeldung für gesperrte Kanten
  

  const handleStageClick = (e) => {
    // Verhindere das Setzen neuer Punkte bei Klick auf interaktive Elemente
    if (e.target instanceof window.Konva.Circle) return; // Punkte
    if (e.target instanceof window.Konva.Line) return;   // Linien/Kanten
    if (e.target instanceof window.Konva.Rect) return;   // Button-Hintergrund
    if (e.target instanceof window.Konva.Text) return;   // Button-Text und Winkel
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
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

  const checkIfMoveAllowed = (pointIndex, newX, newY) => {
    // Überprüfe, ob die Bewegung eines Punktes gesperrte Kanten beeinflusst
    const affectedEdges = [];
    
    // Ein Punkt ist mit zwei Kanten verbunden:
    // 1. Die Kante, die von diesem Punkt ausgeht (Index = pointIndex)
    // 2. Die Kante, die zu diesem Punkt führt (Index = (pointIndex - 1 + points.length) % points.length)
    
    const outgoingEdgeIndex = pointIndex;
    const incomingEdgeIndex = (pointIndex - 1 + points.length) % points.length;
    
    if (lockedEdges.has(outgoingEdgeIndex)) {
      affectedEdges.push(outgoingEdgeIndex);
    }
    
    if (lockedEdges.has(incomingEdgeIndex)) {
      affectedEdges.push(incomingEdgeIndex);
    }
    
    return affectedEdges;
  };

  const handleDragMove = (e, idx) => {
    let { x, y } = e.target.position();

    // Überprüfe, ob die Bewegung gesperrte Kanten beeinflusst
    const affectedLockedEdges = checkIfMoveAllowed(idx, x, y);
    
    if (affectedLockedEdges.length > 0) {
      // Bewegung nicht erlaubt - zeige Fehlermeldung
      setErrorMessage(`Punkt kann nicht bewegt werden - Kante ${affectedLockedEdges[0] + 1} ist gesperrt!`);
      setTimeout(() => setErrorMessage(''), 3000);
      
      // Setze den Punkt auf seine ursprüngliche Position zurück
      e.target.position(points[idx]);
      return;
    }

    if (snapEnabled) {
        const allOtherPoints = points.filter((_, i) => i !== idx);
        // Snap zu anderen Punkten
        for (const otherPoint of allOtherPoints) {
            if (Math.abs(x - otherPoint.x) < SNAP_THRESHOLD_PX) x = otherPoint.x;
            if (Math.abs(y - otherPoint.y) < SNAP_THRESHOLD_PX) y = otherPoint.y;
        }
        
        // Snap zum Grid (Maßstabs-Raster)
        const nearestGridX = Math.round(x / scale) * scale;
        const nearestGridY = Math.round(y / scale) * scale;
        
        if (Math.abs(x - nearestGridX) < SNAP_THRESHOLD_PX) x = nearestGridX;
        if (Math.abs(y - nearestGridY) < SNAP_THRESHOLD_PX) y = nearestGridY;
    }
      
    setPoints(points =>
      points.map((point, i) => (i === idx ? { x, y } : point))
    );
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
            Alle Sperren aufheben ({lockedEdges.size})
          </button>
        </div>
        {/* Informationstext */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          💡 Tipp: Klicken Sie auf die Längenangaben, um sie zu bearbeiten. Bearbeitete Längen werden automatisch gesperrt (🔒).
          <br />
          Gesperrte Kanten (🔒) können durch erneutes Klicken entsperrt werden. Kanten mit 🚫 können nicht bearbeitet werden (beide angrenzenden Kanten gesperrt).
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
      
      <Stage
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: '1px solid black', height: '700px', width: '700px' }}
        onMouseDown={handleStageClick}
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
        {points.map((point, i) => (
          <div key={i}>
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
                {/* Schatten für Winkeltext */}
                <Text
                  x={point.x + 11}
                  y={point.y - 19}
                  text={`${angles[i]}°`}
                  fontSize={12}
                  fill="rgba(0,0,0,0.3)"
                  fontFamily="Arial, sans-serif"
                />
                {/* Winkeltext */}
                <Text
                  x={point.x + 10}
                  y={point.y - 20}
                  text={`${angles[i]}°`}
                  fontSize={12}
                  fill="#374151"
                  fontFamily="Arial, sans-serif"
                  fontStyle="bold"
                />
              </Group>
            )}
          </div>
        ))}
      </Layer>
    </Stage>
    </div>
  );
};

export default CanvasComponent;