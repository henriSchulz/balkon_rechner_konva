import { useState, useRef, useMemo, useEffect } from 'react';
import {
    getAngle,
    metersToPixels,
    getDistance,
    calculatePolygonArea,
    projectPointOnLine,
    getPointOnCircle,
    circleCircleIntersection,
    lineCircleIntersection,
    lineLineIntersection
} from '../utils/geometry';
import { getSnappedPos } from '../utils/snap';
import { calculateProfiles } from '../utils/profiles';
import { DEFAULT_SCALE } from '../constants/canvas';

// Helper function to load state from localStorage, executed only once
const getInitialState = () => {
    try {
        const savedState = localStorage.getItem('canvasState');
        if (savedState) {
            const restored = JSON.parse(savedState);
            return {
                points: restored.points || [],
                snapEnabled: restored.snapEnabled !== false,
                hauswandEdges: restored.hauswandEdges || [],
                scale: restored.scale || DEFAULT_SCALE,
                showLengths: restored.showLengths !== false,
                lockedEdges: new Set(restored.lockedEdges || []),
                lockedAngles: new Set(restored.lockedAngles || []),
                showProfiles: restored.showProfiles !== false,
            };
        }
    } catch (e) {
        console.error("Failed to parse or restore canvas state:", e);
    }
    // Return default state if nothing is saved or an error occurs
    return {
        points: [],
        snapEnabled: true,
        hauswandEdges: [],
        scale: DEFAULT_SCALE,
        showLengths: true,
        lockedEdges: new Set(),
        lockedAngles: new Set(),
        showProfiles: true,
    };
};

export const useCanvasState = (selectedProfile) => {
    // Initialize state from localStorage using a function to ensure it runs only once
    const [initialState] = useState(getInitialState);

    const [points, setPoints] = useState(initialState.points);
    const [isDrawing, setIsDrawing] = useState(initialState.points.length === 0);
    const [isEditing, setIsEditing] = useState(false);
    const [snapEnabled, setSnapEnabled] = useState(initialState.snapEnabled);
    const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState(null);
    const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
    const [hauswandEdges, setHauswandEdges] = useState(initialState.hauswandEdges);
    const [scale, setScale] = useState(initialState.scale);
    const [showLengths, setShowLengths] = useState(initialState.showLengths);
    const [editingEdge, setEditingEdge] = useState(null);
    const [editingLength, setEditingLength] = useState('');
    const [lockedEdges, setLockedEdges] = useState(initialState.lockedEdges);
    const [editingAngle, setEditingAngle] = useState(null);
    const [editingAngleValue, setEditingAngleValue] = useState('');
    const [lockedAngles, setLockedAngles] = useState(initialState.lockedAngles);
    const [errorMessage, setErrorMessage] = useState('');
    const [cursorPos, setCursorPos] = useState(null);
    const [liveLength, setLiveLength] = useState(0);
    const [liveAngle, setLiveAngle] = useState(0);
    const [snapLines, setSnapLines] = useState([]);
    const [showProfiles, setShowProfiles] = useState(initialState.showProfiles);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, pointIndex: null });
    const [dragInfo, setDragInfo] = useState(null);
    const dragStartPoints = useRef(null);
    const isInitialMount = useRef(true);

    // Effekt zur Berechnung von Live-Länge und -Winkel
    useEffect(() => {
        if (isDrawing && points.length > 0 && cursorPos) {
            const lastPoint = points[points.length - 1];

            // Live-Länge berechnen
            const lengthInPixels = getDistance(lastPoint, cursorPos);
            const lengthInMeters = lengthInPixels / scale;
            setLiveLength(lengthInMeters);

            // Live-Winkel berechnen
            if (points.length > 1) {
                const secondLastPoint = points[points.length - 2];
                const angle = getAngle(secondLastPoint, lastPoint, cursorPos);
                setLiveAngle(angle);
            } else {
                setLiveAngle(0); // Kein Winkel beim ersten Segment
            }
        } else {
            setLiveLength(0);
            setLiveAngle(0);
        }
    }, [cursorPos, points, isDrawing, scale]);

    // Hilfsfunktion: Finde den besten Index zum Einfügen eines neuen Punkts
    const findBestInsertionIndex = (points, newPos) => {
        if (points.length < 2) return points.length;
        
        let minDistance = Infinity;
        let bestIndex = 0;
        
        // Prüfe jede Kante des Polygons
        for (let i = 0; i < points.length; i++) {
            const currentPoint = points[i];
            const nextPoint = points[(i + 1) % points.length];
            
            // Berechne den Abstand vom neuen Punkt zur Linie zwischen currentPoint und nextPoint
            const distance = distanceToLineSegment(newPos, currentPoint, nextPoint);
            
            if (distance < minDistance) {
                minDistance = distance;
                bestIndex = i + 1; // Füge nach dem aktuellen Punkt ein
            }
        }
        
        return bestIndex % points.length;
    };

    // Hilfsfunktion: Berechne den Abstand von einem Punkt zu einer Linie
    const distanceToLineSegment = (point, lineStart, lineEnd) => {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Hilfsfunktion: Update locked indices nach dem Einfügen eines Punkts
    const updateLockedIndicesAfterInsertion = (insertIndex) => {
        // Update locked edges
        const newLockedEdges = new Set();
        lockedEdges.forEach(edgeIndex => {
            if (edgeIndex >= insertIndex) {
                newLockedEdges.add(edgeIndex + 1);
            } else {
                newLockedEdges.add(edgeIndex);
            }
        });
        setLockedEdges(newLockedEdges);
        
        // Update locked angles
        const newLockedAngles = new Set();
        lockedAngles.forEach(angleIndex => {
            if (angleIndex >= insertIndex) {
                newLockedAngles.add(angleIndex + 1);
            } else {
                newLockedAngles.add(angleIndex);
            }
        });
        setLockedAngles(newLockedAngles);
        
        // Update hauswand edges
        const newHauswandEdges = hauswandEdges.map(edgeIndex => {
            if (edgeIndex >= insertIndex) {
                return edgeIndex + 1;
            }
            return edgeIndex;
        });
        setHauswandEdges(newHauswandEdges);
    };

    useEffect(() => {
        // Prevent saving to localStorage on the initial render
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const stateToSave = {
            points,
            snapEnabled,
            hauswandEdges,
            scale,
            showLengths,
            lockedEdges: Array.from(lockedEdges),
            lockedAngles: Array.from(lockedAngles),
            showProfiles,
        };
        localStorage.setItem('canvasState', JSON.stringify(stateToSave));
    }, [points, snapEnabled, hauswandEdges, scale, showLengths, lockedEdges, lockedAngles, showProfiles]);

    const handleStageClick = (e) => {
        // Only handle left-clicks to avoid interfering with context menu
        if (e.evt.button !== 0) {
            return;
        }

        // If context menu is visible, the click should only close it and do nothing else.
        if (contextMenu.visible) {
            handleCloseContextMenu();
            return;
        }

        // Im Zeichenmodus: normaler Punktplatzierungs-Workflow
        if (isDrawing) {
            // Check if the click is on the first point to close the polygon
            if (hoveredPointIndex === 0 && points.length > 2) {
                setIsDrawing(false);
                setHoveredPointIndex(null); // Reset hover state
                return;
            }

            const isStage = e.target.getStage() === e.target;
            const isPolygonFill = e.target.className === 'Line' && e.target.fill();
            if (!isStage && !isPolygonFill) return;

            const stage = e.target.getStage();
            let pos = stage.getPointerPosition();

            if (snapEnabled) {
                const lastPoint = points.length > 0 ? points[points.length - 1] : null;
                pos = getSnappedPos(pos, points, lastPoint, scale, setSnapLines);
            }
            setPoints([...points, pos]);
            return;
        }

        // Im Bearbeitungsmodus: Punkte hinzufügen nur bei bestimmten Bedingungen
        if (isEditing) {
            const isStage = e.target.getStage() === e.target;
            const isPolygonFill = e.target.className === 'Line' && e.target.fill();
            
            // Nur bei Klick auf leere Stage oder Polygon-Fläche neue Punkte hinzufügen
            if (!isStage && !isPolygonFill) return;

            const stage = e.target.getStage();
            let pos = stage.getPointerPosition();

            if (snapEnabled) {
                pos = getSnappedPos(pos, points, null, scale, setSnapLines);
            }

            // Finde die beste Position, um den neuen Punkt einzufügen
            const insertIndex = findBestInsertionIndex(points, pos);
            const newPoints = [...points];
            newPoints.splice(insertIndex, 0, pos);
            
            setPoints(newPoints);
            
            // Update locked edges and angles indices nach dem Einfügen
            updateLockedIndicesAfterInsertion(insertIndex);
            return;
        }
    };

    const handleCloseContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, pointIndex: null });
    };

    const findPointAtPosition = (pos, points) => {
        // Check points in reverse order so we get the one on top if they overlap
        for (let i = points.length - 1; i >= 0; i--) {
            const point = points[i];
            const distance = getDistance(pos, point);
            // Using a radius of 10px for hit detection
            if (distance < 10) {
                return i;
            }
        }
        return null;
    };

    const handleStageContextMenu = (e) => {
        e.evt.preventDefault();
        if (!isEditing) return;

        // Close any other open menus/modals
        handleLengthCancel();
        handleAngleCancel();

        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        const pointIndex = findPointAtPosition(pos, points);

        if (pointIndex !== null) {
            const containerRect = stage.container().getBoundingClientRect();
            const contextMenuX = containerRect.left + pos.x;
            const contextMenuY = containerRect.top + pos.y;

            setContextMenu({
                visible: true,
                x: contextMenuX,
                y: contextMenuY,
                pointIndex: pointIndex
            });
        } else {
            // If no point is clicked, ensure the context menu is closed.
            handleCloseContextMenu();
        }
    };

    const handleHauswandSetzen = (edgeIndex) => {
        setHauswandEdges([edgeIndex]);
        setHoveredEdgeIndex(null);
    };

    const handleClearHauswand = () => {
        setHauswandEdges([]);
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
        const p_len = points.length;
        const p1_idx = edgeIndex;
        const p2_idx = (edgeIndex + 1) % p_len;

        const newDistancePixels = metersToPixels(parseFloat(newLength), scale);

        let newPoints = [...points];
        const updatePoint = (index, newPos) => {
            newPoints[index] = newPos;
        };

        const p1 = newPoints[p1_idx];
        const p2 = newPoints[p2_idx];

        const isAngleAtP1Locked = lockedAngles.has(p1_idx);
        const isAngleAtP2Locked = lockedAngles.has(p2_idx);

        if (isAngleAtP1Locked && isAngleAtP2Locked) {
            setErrorMessage('Länge kann nicht geändert werden - beide anliegenden Winkel sind gesperrt!');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        } else if (isAngleAtP1Locked) {
            // Angle at p1 is locked, so p1 is the pivot. Move p2.
            const newP2 = getPointOnCircle(p2, p1, newDistancePixels);
            updatePoint(p2_idx, newP2);
        } else if (isAngleAtP2Locked) {
            // Angle at p2 is locked, so p2 is the pivot. Move p1.
            const newP1 = getPointOnCircle(p1, p2, newDistancePixels);
            updatePoint(p1_idx, newP1);
        } else {
            // If no angles are locked, fall back to the old logic based on locked edges.
            const p0_idx = (p1_idx - 1 + p_len) % p_len;
            const p3_idx = (p2_idx + 1) % p_len;
            const isP0P1Locked = lockedEdges.has(p0_idx);
            const isP2P3Locked = lockedEdges.has(p2_idx);

            if (isP0P1Locked && isP2P3Locked) {
                setErrorMessage('Kante kann nicht bearbeitet werden - beide angrenzenden Kanten sind gesperrt!');
                setTimeout(() => setErrorMessage(''), 3000);
                return;
            } else if (isP0P1Locked) {
                const newP2 = getPointOnCircle(p2, p1, newDistancePixels);
                updatePoint(p2_idx, newP2);
            } else if (isP2P3Locked) {
                const newP1 = getPointOnCircle(p1, p2, newDistancePixels);
                updatePoint(p1_idx, newP1);
            } else {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const currentLength = Math.hypot(dx, dy);
                const unitX = currentLength > 0 ? dx / currentLength : 0;
                const unitY = currentLength > 0 ? dy / currentLength : 0;
                const lengthDifference = newDistancePixels - currentLength;
                const moveDistance = lengthDifference / 2;
                const newP1 = { x: p1.x - unitX * moveDistance, y: p1.y - unitY * moveDistance };
                const newP2 = { x: p2.x + unitX * moveDistance, y: p2.y + unitY * moveDistance };
                updatePoint(p1_idx, newP1);
                updatePoint(p2_idx, newP2);
            }
        }

        setPoints(newPoints);
        setLockedEdges(prev => new Set([...prev, edgeIndex]));
        setEditingEdge(null);
        setEditingLength('');
    };

    const handleAngleChange = (newAngle) => {
        if (editingAngle === null || !newAngle || isNaN(newAngle)) return;

        const angleIndex = editingAngle;
        const targetAngleDegrees = parseFloat(newAngle);

        if (targetAngleDegrees <= 0 || targetAngleDegrees >= 180) {
            setErrorMessage('Winkel muss zwischen 1° und 179° liegen!');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        const p_len = points.length;
        const prevEdgeIndex = (angleIndex - 1 + p_len) % p_len;
        const nextEdgeIndex = angleIndex;

        const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
        const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);
        const prevPointIndex = (angleIndex - 1 + p_len) % p_len;
        const nextPointIndex = (angleIndex + 1) % p_len;
        const isPrevAngleLocked = lockedAngles.has(prevPointIndex);
        const isNextAngleLocked = lockedAngles.has(nextPointIndex);

        if (isPrevEdgeLocked && isNextEdgeLocked) {
            setErrorMessage('Winkel kann nicht bearbeitet werden - beide angrenzenden Kanten sind gesperrt!');
            setTimeout(() => setErrorMessage(''), 3000);
            setEditingAngle(null);
            setEditingAngleValue('');
            return;
        }

        // Prevent modification if it would affect other locked angles
        if ((!isPrevEdgeLocked && isNextAngleLocked) || (!isNextEdgeLocked && isPrevAngleLocked)) {
            setErrorMessage('Winkel kann nicht bearbeitet werden - eine anliegende Ecke hat einen gesperrten Winkel!');
            setTimeout(() => setErrorMessage(''), 3000);
            setEditingAngle(null);
            setEditingAngleValue('');
            return;
        }

        const newPoints = [...points];
        const currentPoint = points[angleIndex];
        const prevPoint = points[(angleIndex - 1 + p_len) % p_len];
        const nextPoint = points[(angleIndex + 1) % p_len];

        const v1 = { x: prevPoint.x - currentPoint.x, y: prevPoint.y - currentPoint.y };
        const v2 = { x: nextPoint.x - currentPoint.x, y: nextPoint.y - currentPoint.y };

        const crossProduct = v1.x * v2.y - v1.y * v2.x;
        const sign = crossProduct !== 0 ? Math.sign(crossProduct) : 1;

        const targetAngleRad = targetAngleDegrees * Math.PI / 180;
        const rotationRad = sign * targetAngleRad;

        const v1_angle = Math.atan2(v1.y, v1.x);
        const v2_angle = Math.atan2(v2.y, v2.x);

        if (isPrevEdgeLocked) {
            const new_v2_angle = v1_angle + rotationRad;
            const v2_length = Math.hypot(v2.x, v2.y);
            const new_v2 = {
                x: v2_length * Math.cos(new_v2_angle),
                y: v2_length * Math.sin(new_v2_angle)
            };
            newPoints[(angleIndex + 1) % p_len] = {
                x: currentPoint.x + new_v2.x,
                y: currentPoint.y + new_v2.y
            };
        } else if (isNextEdgeLocked) {
            const new_v1_angle = v2_angle - rotationRad;
            const v1_length = Math.hypot(v1.x, v1.y);
            const new_v1 = {
                x: v1_length * Math.cos(new_v1_angle),
                y: v1_length * Math.sin(new_v1_angle)
            };
            newPoints[(angleIndex - 1 + p_len) % p_len] = {
                x: currentPoint.x + new_v1.x,
                y: currentPoint.y + new_v1.y
            };
        } else {
            const currentAngleRad = Math.acos(
                (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))
            );

            const totalRotation = rotationRad - (sign * currentAngleRad);
            const halfRotation = totalRotation / 2;

            const v1_length = Math.hypot(v1.x, v1.y);
            const new_v1_angle = v1_angle - halfRotation;
            newPoints[(angleIndex - 1 + p_len) % p_len] = {
                x: currentPoint.x + v1_length * Math.cos(new_v1_angle),
                y: currentPoint.y + v1_length * Math.sin(new_v1_angle)
            };

            const v2_length = Math.hypot(v2.x, v2.y);
            const new_v2_angle = v2_angle + halfRotation;
            newPoints[(angleIndex + 1) % p_len] = {
                x: currentPoint.x + v2_length * Math.cos(new_v2_angle),
                y: currentPoint.y + v2_length * Math.sin(new_v2_angle)
            };
        }

        setPoints(newPoints);
        setLockedAngles(prev => new Set([...prev, angleIndex]));
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

    const handleDeletePoint = (pointIndex) => {
        if (points.length <= 3) {
            setErrorMessage('Mindestens 3 Punkte erforderlich!');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        const newPoints = points.filter((_, index) => index !== pointIndex);
        setPoints(newPoints);
        handleCloseContextMenu(); // Close context menu after deleting

        const newLockedEdges = new Set();
        lockedEdges.forEach(edgeIndex => {
            if (edgeIndex < pointIndex) newLockedEdges.add(edgeIndex);
            else if (edgeIndex > pointIndex) newLockedEdges.add(edgeIndex - 1);
        });
        setLockedEdges(newLockedEdges);

        const newLockedAngles = new Set();
        lockedAngles.forEach(angleIndex => {
            if (angleIndex < pointIndex) newLockedAngles.add(angleIndex);
            else if (angleIndex > pointIndex) newLockedAngles.add(angleIndex - 1);
        });
        setLockedAngles(newLockedAngles);

        const newHauswandEdges = hauswandEdges
            .map(edgeIndex => {
                if (edgeIndex < pointIndex) return edgeIndex;
                if (edgeIndex > pointIndex) return edgeIndex - 1;
                return -1;
            })
            .filter(edgeIndex => edgeIndex !== -1);
        setHauswandEdges(newHauswandEdges);
    };

    const handleUndo = () => {
        if (isDrawing && points.length > 0) {
            setPoints(points.slice(0, -1));
        }
    };

    const handleClearAllPoints = () => {
        setPoints([]);
        setLockedEdges(new Set());
        setLockedAngles(new Set());
        setHauswandEdges([]);
        setIsDrawing(true);
        setIsEditing(false);
    };

    const handleDragStart = (e, idx) => {
        setErrorMessage('');
        dragStartPoints.current = points;

        if (!isEditing) return;

        const p_len = points.length;
        const prevPointIndex = (idx - 1 + p_len) % p_len;
        const nextPointIndex = (idx + 1) % p_len;

        const incomingEdgeIndex = prevPointIndex;
        const outgoingEdgeIndex = idx;

        const isIncomingEdgeLocked = lockedEdges.has(incomingEdgeIndex);
        const isOutgoingEdgeLocked = lockedEdges.has(outgoingEdgeIndex);
        const isCurrentAngleLocked = lockedAngles.has(idx);

        let info = { pointIndex: idx, constraints: [] };

        // New angle constraint logic: applies when dragging a point *adjacent* to a locked angle
        const isPrevAngleLocked = lockedAngles.has(prevPointIndex);
        const isNextAngleLocked = lockedAngles.has(nextPointIndex);

        if (isPrevAngleLocked) {
            // Dragging point idx, angle is at prevPointIndex. The line is defined by idx and prevPointIndex.
            info.constraints.push({
                type: 'line',
                line: {
                    p1: points[idx],
                    p2: points[prevPointIndex]
                }
            });
        }

        if (isNextAngleLocked) {
             // Dragging point idx, angle is at nextPointIndex. The line is defined by idx and nextPointIndex.
             info.constraints.push({
                type: 'line',
                line: {
                    p1: points[idx],
                    p2: points[nextPointIndex]
                }
            });
        }

        // Edge constraints
        if (isIncomingEdgeLocked) {
            info.constraints.push({
                type: 'radius',
                center: points[prevPointIndex],
                radius: getDistance(points[prevPointIndex], points[idx])
            });
        }
        if (isOutgoingEdgeLocked) {
            info.constraints.push({
                type: 'radius',
                center: points[nextPointIndex],
                radius: getDistance(points[idx], points[nextPointIndex])
            });
        }

        if (info.constraints.length > 0) {
            setDragInfo(info);
        }
    };

    const handleDragMove = (e, idx) => {
        let newPos = e.target.position();

        if (isDrawing) {
             if (snapEnabled) {
                const otherPoints = points.filter((_, i) => i !== idx);
                newPos = getSnappedPos(newPos, otherPoints, null, scale, setSnapLines);
            }
        } else if (isEditing && dragInfo) {
            const lineConstraints = dragInfo.constraints.filter(c => c.type === 'line');
            const radiusConstraints = dragInfo.constraints.filter(c => c.type === 'radius');

            if (lineConstraints.length === 2) {
                const intersection = lineLineIntersection(
                    lineConstraints[0].line.p1, lineConstraints[0].line.p2,
                    lineConstraints[1].line.p1, lineConstraints[1].line.p2
                );
                if (intersection) {
                    newPos = intersection;
                } else {
                    newPos = points[idx]; // Parallel lines, stay put
                }
            } else if (lineConstraints.length === 1 && radiusConstraints.length === 1) {
                const intersections = lineCircleIntersection(lineConstraints[0].line.p1, lineConstraints[0].line.p2, radiusConstraints[0].center, radiusConstraints[0].radius);
                if (intersections.length > 0) {
                    newPos = intersections.reduce((prev, curr) => getDistance(newPos, prev) < getDistance(newPos, curr) ? prev : curr);
                } else {
                    newPos = points[idx]; // No valid position, stay put
                }
            } else if (lineConstraints.length === 1) {
                newPos = projectPointOnLine(newPos, lineConstraints[0].line.p1, lineConstraints[0].line.p2);
            } else if (radiusConstraints.length === 2) {
                 const intersections = circleCircleIntersection(radiusConstraints[0].center, radiusConstraints[0].radius, radiusConstraints[1].center, radiusConstraints[1].radius);
                 if (intersections.length > 0) {
                    newPos = intersections.reduce((prev, curr) => getDistance(newPos, prev) < getDistance(newPos, curr) ? prev : curr);
                 } else {
                    newPos = points[idx];
                 }
            } else if (radiusConstraints.length === 1) {
                newPos = getPointOnCircle(newPos, radiusConstraints[0].center, radiusConstraints[0].radius);
            } else if (snapEnabled) {
                 const otherPoints = points.filter((_, i) => i !== idx);
                 newPos = getSnappedPos(newPos, otherPoints, null, scale, setSnapLines);
            }
        } else if (snapEnabled) {
            const otherPoints = points.filter((_, i) => i !== idx);
            newPos = getSnappedPos(newPos, otherPoints, null, scale, setSnapLines);
        }

        e.target.position(newPos);
        const newPoints = points.map((p, i) => (i === idx ? newPos : p));
        setPoints(newPoints);
    };

    const handleDragEnd = (e, idx) => {
        setSnapLines([]);
        setDragInfo(null);
        dragStartPoints.current = null;
    };

    // Derived data
    const angles = useMemo(() => (
        points.length > 2 ? points.map((p, i, arr) => {
            const prev = arr[(i - 1 + arr.length) % arr.length];
            const next = arr[(i + 1) % arr.length];
            return getAngle(prev, p, next);
        }) : []
    ), [points]);

    const polygonArea = useMemo(() => calculatePolygonArea(points, scale), [points, scale]);

    const profileData = useMemo(() => {
        if (points.length < 3 || hauswandEdges.length === 0) {
            return { profileDetails: [], profileCounts: {} };
        }
        const hauswandIndex = hauswandEdges[0];
        const wallP1 = points[hauswandIndex];
        const wallP2 = points[(hauswandIndex + 1) % points.length];
        const allPointsArray = points.map(p => [p.x, p.y]);
        const wallP1Array = [wallP1.x, wallP1.y];
        const wallP2Array = [wallP2.x, wallP2.y];
        return calculateProfiles(allPointsArray, wallP1Array, wallP2Array, scale, selectedProfile);
    }, [points, hauswandEdges, scale, selectedProfile]);

    return {
        // State
        points,
        isDrawing,
        setIsDrawing,
        isEditing,
        setIsEditing,
        snapEnabled,
        setSnapEnabled,
        hoveredEdgeIndex,
        setHoveredEdgeIndex,
        hoveredPointIndex,
        setHoveredPointIndex,
        hauswandEdges,
        scale,
        setScale,
        showLengths,
        setShowLengths,
        editingEdge,
        editingLength,
        setEditingLength,
        lockedEdges,
        setLockedEdges,
        editingAngle,
        editingAngleValue,
        setEditingAngleValue,
        lockedAngles,
        setLockedAngles,
        errorMessage,
        cursorPos,
        setCursorPos,
        liveLength,
        liveAngle,
        snapLines,
        setSnapLines,
        showProfiles,
        setShowProfiles,
        contextMenu,
        dragInfo,

        // Handlers
        handleStageClick,
        handleStageContextMenu,
        handleCloseContextMenu,
        handleHauswandSetzen,
        handleClearHauswand,
        handleLengthClick,
        handleAngleClick,
        handleLengthChange,
        handleAngleChange,
        handleAngleCancel,
        handleLengthCancel,
        handleUnlockEdge,
        handleUnlockAngle,
        handleDeletePoint,
        handleClearAllPoints,
        handleUndo,
        handleDragStart,
        handleDragMove,
        handleDragEnd,

        // Derived Data
        angles,
        polygonArea,
        profileData
    };
};