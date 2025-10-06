import { getDistance } from './geometry';
import { SNAP_THRESHOLD_PX, ANGLE_SNAP_THRESHOLD_DEG } from '../constants/canvas';

export const getSnappedPos = (pos, allPoints, lastPoint, scale, setSnapLines) => {
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
            newSnapLines.push({ type: 'axis', points: [otherPoint.x, 0, otherPoint.x, 500] }); // Assuming CANVAS_SIZE
        }
        if (Math.abs(snappedPos.y - otherPoint.y) < SNAP_THRESHOLD_PX) {
            snappedPos.y = otherPoint.y;
            newSnapLines.push({ type: 'axis', points: [0, otherPoint.y, 500, otherPoint.y] }); // Assuming CANVAS_SIZE
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