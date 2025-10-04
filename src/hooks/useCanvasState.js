import { useState, useRef, useMemo, useEffect } from 'react';
import {
    getAngle,
    metersToPixels,
    getDistance,
    calculatePolygonArea
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

export const useCanvasState = () => {
    // Initialize state from localStorage using a function to ensure it runs only once
    const [initialState] = useState(getInitialState);

    const [points, setPoints] = useState(initialState.points);
    const [snapEnabled, setSnapEnabled] = useState(initialState.snapEnabled);
    const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState(null);
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
    const [snapLines, setSnapLines] = useState([]);
    const [showProfiles, setShowProfiles] = useState(initialState.showProfiles);
    const dragStartPoints = useRef(null);
    const isInitialMount = useRef(true);

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
        const point1Index = edgeIndex;
        const point2Index = (edgeIndex + 1) % points.length;
        const point1 = points[point1Index];
        const point2 = points[point2Index];

        const prevEdgeIndex = (edgeIndex - 1 + points.length) % points.length;
        const nextEdgeIndex = (edgeIndex + 1) % points.length;
        const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
        const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);

        const newDistancePixels = metersToPixels(parseFloat(newLength), scale);
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const currentLength = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / currentLength;
        const unitY = dy / currentLength;
        const newPoints = [...points];

        if (isPrevEdgeLocked && isNextEdgeLocked) {
            setErrorMessage('Kante kann nicht bearbeitet werden - beide angrenzenden Kanten sind gesperrt!');
            setTimeout(() => setErrorMessage(''), 3000);
        } else if (isPrevEdgeLocked) {
            newPoints[point2Index] = {
                x: point1.x + unitX * newDistancePixels,
                y: point1.y + unitY * newDistancePixels
            };
        } else if (isNextEdgeLocked) {
            newPoints[point1Index] = {
                x: point2.x - unitX * newDistancePixels,
                y: point2.y - unitY * newDistancePixels
            };
        } else {
            const lengthDifference = newDistancePixels - getDistance(point1, point2);
            const moveDistance = lengthDifference / 2;
            newPoints[point1Index] = { x: point1.x - unitX * moveDistance, y: point1.y - unitY * moveDistance };
            newPoints[point2Index] = { x: point2.x + unitX * moveDistance, y: point2.y + unitY * moveDistance };
        }

        setPoints(newPoints);
        setLockedEdges(prev => new Set([...prev, edgeIndex]));
        setEditingEdge(null);
        setEditingLength('');
    };

    const handleAngleChange = (newAngle) => {
        if (editingAngle === null || !newAngle || isNaN(newAngle)) return;

        const angleIndex = editingAngle;
        const angleValue = parseFloat(newAngle);

        if (angleValue <= 0 || angleValue >= 180) {
            setErrorMessage('Winkel muss zwischen 1° und 179° liegen!');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        const p_len = points.length;
        const prevEdgeIndex = (angleIndex - 1 + p_len) % p_len;
        const nextEdgeIndex = angleIndex;

        const isPrevEdgeLocked = lockedEdges.has(prevEdgeIndex);
        const isNextEdgeLocked = lockedEdges.has(nextEdgeIndex);

        if (isPrevEdgeLocked && isNextEdgeLocked) {
            setErrorMessage('Winkel kann nicht bearbeitet werden - beide angrenzenden Kanten sind gesperrt!');
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

        const currentAngle = getAngle(prevPoint, currentPoint, nextPoint);
        const angleDiff = angleValue - currentAngle;
        const rotationRad = (angleDiff * Math.PI) / 180;

        if (isPrevEdgeLocked) {
            const cos = Math.cos(rotationRad);
            const sin = Math.sin(rotationRad);
            newPoints[(angleIndex + 1) % p_len] = {
                x: currentPoint.x + (v2.x * cos - v2.y * sin),
                y: currentPoint.y + (v2.x * sin + v2.y * cos)
            };
        } else if (isNextEdgeLocked) {
            const cos = Math.cos(-rotationRad);
            const sin = Math.sin(-rotationRad);
            newPoints[(angleIndex - 1 + p_len) % p_len] = {
                x: currentPoint.x + (v1.x * cos - v1.y * sin),
                y: currentPoint.y + (v1.x * sin + v1.y * cos)
            };
        } else {
            const halfRotation = rotationRad / 2;
            const cos1 = Math.cos(-halfRotation);
            const sin1 = Math.sin(-halfRotation);
            newPoints[(angleIndex - 1 + p_len) % p_len] = {
                x: currentPoint.x + (v1.x * cos1 - v1.y * sin1),
                y: currentPoint.y + (v1.x * sin1 + v1.y * cos1)
            };

            const cos2 = Math.cos(halfRotation);
            const sin2 = Math.sin(halfRotation);
            newPoints[(angleIndex + 1) % p_len] = {
                x: currentPoint.x + (v2.x * cos2 - v2.y * sin2),
                y: currentPoint.y + (v2.x * sin2 + v2.y * cos2)
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

    const handleClearAllPoints = () => {
        setPoints([]);
        setLockedEdges(new Set());
        setLockedAngles(new Set());
        setHauswandEdges([]);
    };

    const checkIfMoveAllowed = (pointIndex) => {
        const affectedEdges = [];
        const affectedAngles = [];

        const outgoingEdgeIndex = pointIndex;
        const incomingEdgeIndex = (pointIndex - 1 + points.length) % points.length;

        if (lockedEdges.has(outgoingEdgeIndex)) affectedEdges.push(outgoingEdgeIndex);
        if (lockedEdges.has(incomingEdgeIndex)) affectedEdges.push(incomingEdgeIndex);

        if (lockedAngles.has(pointIndex)) affectedAngles.push(pointIndex);

        const prevAngleIndex = (pointIndex - 1 + points.length) % points.length;
        const nextAngleIndex = (pointIndex + 1) % points.length;

        if (lockedAngles.has(prevAngleIndex)) affectedAngles.push(prevAngleIndex);
        if (lockedAngles.has(nextAngleIndex)) affectedAngles.push(nextAngleIndex);

        return { edges: affectedEdges, angles: affectedAngles };
    };

    const handleDragStart = (e, idx) => {
        setErrorMessage('');
        dragStartPoints.current = points;
    };

    const handleDragMove = (e, idx) => {
        const affected = checkIfMoveAllowed(idx);
        if (affected.edges.length > 0 || affected.angles.length > 0) {
            e.target.position(points[idx]);
            return;
        }

        let newPos = e.target.position();
        if (snapEnabled) {
            const otherPoints = points.filter((_, i) => i !== idx);
            newPos = getSnappedPos(newPos, otherPoints, null, scale, setSnapLines);
            e.target.position(newPos);
        }

        const newPoints = points.map((p, i) => (i === idx ? newPos : p));
        setPoints(newPoints);
    };

    const handleDragEnd = (e, idx) => {
        setSnapLines([]);
        const affected = checkIfMoveAllowed(idx);
        if (affected.edges.length > 0 || affected.angles.length > 0) {
            let message = 'Punkt kann nicht bewegt werden!';
            setErrorMessage(message);
            setTimeout(() => setErrorMessage(''), 3000);
            setPoints(dragStartPoints.current);
        }
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
        return calculateProfiles(allPointsArray, wallP1Array, wallP2Array, scale);
    }, [points, hauswandEdges, scale]);

    return {
        // State
        points,
        snapEnabled,
        setSnapEnabled,
        hoveredEdgeIndex,
        setHoveredEdgeIndex,
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
        snapLines,
        setSnapLines,
        showProfiles,
        setShowProfiles,

        // Handlers
        handleStageClick,
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
        handleDragStart,
        handleDragMove,
        handleDragEnd,

        // Derived Data
        angles,
        polygonArea,
        profileData
    };
};