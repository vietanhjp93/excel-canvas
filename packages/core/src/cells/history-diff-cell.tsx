import type { CustomCell, GridCell, Rectangle } from "../internal/data-grid/data-grid-types.js";
import { GridCellKind as GridCellKindEnum } from "../internal/data-grid/data-grid-types.js";
import type { FullTheme } from "../common/styles.js";
import type { DrawArgs, CustomRenderer } from "./cell-types.js";

export type HistoryDiffSegmentVariant = "unchanged" | "removed" | "added" | "arrow";

export interface HistoryDiffSegment {
    readonly text: string;
    readonly variant: HistoryDiffSegmentVariant;
    readonly color?: string;
}

export type HistoryDiffLayout = "inline" | "stacked";

export interface HistoryDiffCellData {
    readonly type: "history-diff";
    readonly layout: HistoryDiffLayout;
    readonly primary: readonly HistoryDiffSegment[];
    readonly secondary?: readonly HistoryDiffSegment[];
    readonly readonly?: boolean;
    readonly copyData?: string;
}

export type HistoryDiffCell = CustomCell<HistoryDiffCellData> & {
    readonly kind: GridCellKindEnum.Custom;
    readonly allowOverlay: false;
    readonly readonly: true;
};

export function isHistoryDiffCell(cell: GridCell): cell is HistoryDiffCell {
    return (
        cell.kind === GridCellKindEnum.Custom &&
        typeof (cell as CustomCell<HistoryDiffCellData>).data === "object" &&
        (cell as CustomCell<HistoryDiffCellData>).data?.type === "history-diff"
    );
}

const removedColor = (theme: FullTheme) => theme.textMedium;
const addedColorDefault = "#d32f2f";
const addedColor = (_theme: FullTheme) => addedColorDefault;

function drawSegment(
    ctx: CanvasRenderingContext2D,
    theme: FullTheme,
    x: number,
    y: number,
    segment: HistoryDiffSegment
): number {
    let fill = theme.textDark;
    if (segment.variant === "removed") {
        fill = segment.color ?? removedColor(theme);
    } else if (segment.variant === "added") {
        fill = segment.color ?? addedColor(theme);
    }

    ctx.fillStyle = fill;
    ctx.fillText(segment.text, x, y);

    const metrics = ctx.measureText(segment.text);

    if (segment.variant === "arrow") {
        return metrics.width;
    }

    if (segment.variant === "removed") {
        const midline = y - metrics.actualBoundingBoxAscent / 2;
        const offset = Math.max(1, Math.floor(metrics.actualBoundingBoxAscent / 10));
        ctx.strokeStyle = fill;

        ctx.beginPath();
        ctx.moveTo(x, midline - offset);
        ctx.lineTo(x + metrics.width, midline - offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, midline + offset);
        ctx.lineTo(x + metrics.width, midline + offset);
        ctx.stroke();
    }

    return metrics.width;
}

function drawInline(args: DrawArgs<HistoryDiffCell>, cell: HistoryDiffCell, rect: Rectangle) {
    const { ctx, theme } = args;
    const centerY = rect.y + rect.height / 2;
    ctx.textBaseline = "middle";
    let cursorX = rect.x + theme.cellHorizontalPadding;

    for (const segment of cell.data.primary) {
        const width = drawSegment(ctx, theme, cursorX, centerY, segment);
        cursorX += width;
    }
}

function drawStacked(args: DrawArgs<HistoryDiffCell>, cell: HistoryDiffCell, rect: Rectangle) {
    const { ctx, theme } = args;
    const parsedFont = Number.parseInt(theme.baseFontFull.replace(/[^\d.]/g, ""), 10);
    const lineHeight = Number.isFinite(parsedFont) && parsedFont > 0 ? parsedFont : 16;
    const topPadding = theme.cellVerticalPadding;
    const startX = rect.x + theme.cellHorizontalPadding;
    let cursorY = rect.y + topPadding + lineHeight / 2;

    ctx.textBaseline = "middle";

    for (const segment of cell.data.primary) {
        drawSegment(ctx, theme, startX, cursorY, segment);
    }

    cursorY += lineHeight + theme.cellVerticalPadding;

    if (cell.data.secondary !== undefined) {
        for (const segment of cell.data.secondary) {
            drawSegment(ctx, theme, startX, cursorY, segment);
        }
    }
}

export const historyDiffCellRenderer: CustomRenderer<HistoryDiffCell> = {
    kind: GridCellKindEnum.Custom,
    isMatch: (cell): cell is HistoryDiffCell => isHistoryDiffCell(cell as GridCell),
    draw: (args, cell) => {
        const { ctx, rect, theme } = args;
        ctx.save();
        ctx.font = theme.baseFontFull;
        ctx.fillStyle = theme.textDark;

        if (cell.data.layout === "stacked") {
            drawStacked(args, cell, rect);
        } else {
            drawInline(args, cell, rect);
        }

        ctx.restore();
    },
    measure: (ctx, cell, theme) => {
        ctx.save();
        ctx.font = theme.baseFontFull;
        const segments =
            cell.data.layout === "stacked" ? [...cell.data.primary, ...(cell.data.secondary ?? [])] : cell.data.primary;
        const width = segments.reduce((w, segment) => w + ctx.measureText(segment.text).width, 0);
        ctx.restore();
        return width + theme.cellHorizontalPadding * 2;
    },
    provideEditor: () => undefined,
};

export function createHistoryDiffCell(data: HistoryDiffCellData): HistoryDiffCell {
    const textForCopy =
        data.copyData ??
        (data.layout === "stacked"
            ? (data.secondary ?? data.primary).map(s => s.text).join("")
            : data.primary.map(s => s.text).join(""));

    return {
        kind: GridCellKindEnum.Custom,
        data,
        copyData: textForCopy,
        allowOverlay: false,
        readonly: true,
    };
}
