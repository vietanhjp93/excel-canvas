import type { GridMouseCellEventArgs } from "./event-args.js";

export interface RowMarkerEdgeHover {
    readonly row: number;
    readonly position: "top" | "bottom";
    readonly insertIndex: number;
}

export const ROW_MARKER_EDGE_THRESHOLD = 6;

export function getRowMarkerEdgeHover(
    args: GridMouseCellEventArgs,
    dataRowCount: number,
    threshold: number = ROW_MARKER_EDGE_THRESHOLD
): RowMarkerEdgeHover | undefined {
    if (dataRowCount <= 0) {
        return undefined;
    }

    const { bounds } = args;
    if (bounds === undefined) {
        return undefined;
    }

    const [col, row] = args.location;
    if (col !== 0) {
        return undefined;
    }

    if (row < 0 || row >= dataRowCount) {
        return undefined;
    }

    const topDistance = args.localEventY;
    const bottomDistance = bounds.height - args.localEventY;

    const candidates: Array<{ distance: number; position: "top" | "bottom"; insertIndex: number }> = [];

    if (topDistance >= 0 && topDistance <= threshold) {
        candidates.push({
            distance: topDistance,
            position: "top",
            insertIndex: row === 0 ? 0 : row,
        });
    }

    if (bottomDistance >= 0 && bottomDistance <= threshold) {
        candidates.push({
            distance: bottomDistance,
            position: "bottom",
            insertIndex: Math.min(row + 1, dataRowCount),
        });
    }

    if (candidates.length === 0) {
        return undefined;
    }

    candidates.sort((a, b) => a.distance - b.distance);
    const best = candidates[0];

    return {
        row,
        position: best.position,
        insertIndex: best.insertIndex,
    };
}
