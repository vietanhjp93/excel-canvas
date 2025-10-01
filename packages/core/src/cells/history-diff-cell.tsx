import type { CustomCell, GridCell, Rectangle } from "../internal/data-grid/data-grid-types.js";
import { GridCellKind as GridCellKindEnum } from "../internal/data-grid/data-grid-types.js";
import type { FullTheme } from "../common/styles.js";
import { getEmHeight, getMiddleCenterBias } from "../internal/data-grid/render/data-grid-lib.js";
import type { DrawArgs, CustomRenderer } from "./cell-types.js";

export type HistoryDiffSegmentVariant = "unchanged" | "removed" | "added" | "arrow" | "break-line";

export interface HistoryDiffSegment {
    readonly text: string;
    readonly variant: HistoryDiffSegmentVariant;
    readonly color?: string;
}

export type HistoryDiffLayout = "inline" | "stacked";

export interface HistoryDiffCellData {
    readonly type: "history-diff";
    readonly layout: HistoryDiffLayout;
    readonly data: readonly HistoryDiffSegment[];
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
const BREAK_LINE: HistoryDiffSegmentVariant = "break-line";

interface PositionedSegment {
    readonly segment: HistoryDiffSegment;
    readonly text: string;
    readonly x: number;
    readonly line: number;
}

interface LayoutResult {
    readonly spans: readonly PositionedSegment[];
    readonly lineCount: number;
    readonly breakLineCount: number;
}

function layoutSegments(
    ctx: CanvasRenderingContext2D,
    segments: readonly HistoryDiffSegment[],
    availableWidth: number
): LayoutResult {
    const spans: PositionedSegment[] = [];
    if (availableWidth <= 0) {
        return { spans, lineCount: 0, breakLineCount: 0 };
    }

    let cursor = 0;
    let line = 0;
    let maxLine = 0;
    let hasContent = false;
    let breakLineCount = 0;

    const advanceLine = () => {
        line++;
        if (line > maxLine) {
            maxLine = line;
        }
        cursor = 0;
    };

    const emitSpan = (segment: HistoryDiffSegment, text: string) => {
        if (text.length === 0) {
            return;
        }

        const width = ctx.measureText(text).width;
        if (width === 0) {
            return;
        }

        spans.push({
            segment,
            text,
            x: cursor,
            line,
        });
        hasContent = true;
        if (line > maxLine) {
            maxLine = line;
        }
        cursor += width;

        if (cursor >= availableWidth - 0.5) {
            advanceLine();
        }
    };

    const breakWord = (segment: HistoryDiffSegment, word: string) => {
        let remainingWord = word;
        while (remainingWord.length > 0) {
            const widthAvailable = Math.max(1, availableWidth - cursor);
            let low = 1;
            let high = remainingWord.length;
            let best = 0;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const slice = remainingWord.slice(0, mid);
                const sliceWidth = ctx.measureText(slice).width;
                if (sliceWidth <= widthAvailable) {
                    best = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            if (best === 0) {
                best = 1;
            }

            const piece = remainingWord.slice(0, best);
            emitSpan(segment, piece);
            remainingWord = remainingWord.slice(best);

            if (remainingWord.length > 0 && cursor !== 0) {
                advanceLine();
            }
        }
    };

    for (const segment of segments) {
        if (segment.variant === BREAK_LINE) {
            breakLineCount++;
            advanceLine();
            continue;
        }

        let remaining = segment.text.replace(/\r/g, "");

        while (remaining.length > 0) {
            const newlineIndex = remaining.indexOf("\n");
            const chunk = newlineIndex === -1 ? remaining : remaining.slice(0, newlineIndex);
            const afterChunk = newlineIndex === -1 ? "" : remaining.slice(newlineIndex + 1);

            if (chunk.length > 0) {
                const tokens = chunk.match(/\S+|\s+/g);
                if (tokens !== null) {
                    let tokenIndex = 0;
                    while (tokenIndex < tokens.length) {
                        const token = tokens[tokenIndex];
                        if (token.length === 0) {
                            tokenIndex++;
                            continue;
                        }

                        const isWhitespace = /^\s+$/.test(token);
                        if (isWhitespace) {
                            const whitespaceWidth = ctx.measureText(token).width;
                            if (whitespaceWidth === 0) {
                                tokenIndex++;
                                continue;
                            }
                            if (cursor !== 0 && cursor + whitespaceWidth > availableWidth + 0.5) {
                                advanceLine();
                                tokenIndex++;
                                continue;
                            }
                            if (cursor === 0 && whitespaceWidth > availableWidth + 0.5) {
                                tokenIndex++;
                                continue;
                            }
                            emitSpan(segment, token);
                            tokenIndex++;
                            continue;
                        }

                        const word = token;
                        const nextToken = tokens[tokenIndex + 1];
                        const trailingWhitespace =
                            typeof nextToken === "string" && /^\s+$/.test(nextToken) ? nextToken : "";

                        const wordWidth = ctx.measureText(word).width;

                        if (wordWidth > availableWidth + 0.5) {
                            if (cursor !== 0) {
                                advanceLine();
                            }
                            breakWord(segment, word);
                            tokenIndex += trailingWhitespace.length > 0 ? 2 : 1;
                            continue;
                        }

                        if (cursor !== 0 && cursor + wordWidth > availableWidth + 0.5) {
                            advanceLine();
                        }

                        emitSpan(segment, word);

                        if (trailingWhitespace.length > 0) {
                            const whitespaceWidth = ctx.measureText(trailingWhitespace).width;
                            if (cursor !== 0 && cursor + whitespaceWidth > availableWidth + 0.5) {
                                advanceLine();
                            } else if (cursor === 0 && whitespaceWidth > availableWidth + 0.5) {
                                // drop whitespace that still cannot fit at the start of a line
                            } else {
                                emitSpan(segment, trailingWhitespace);
                            }
                            tokenIndex += 2;
                        } else {
                            tokenIndex += 1;
                        }
                    }
                }
            }

            if (newlineIndex !== -1) {
                advanceLine();
            }

            remaining = afterChunk;
        }
    }

    const lineCount = hasContent ? maxLine + 1 : 0;
    return { spans, lineCount, breakLineCount };
}

function drawSegment(
    ctx: CanvasRenderingContext2D,
    theme: FullTheme,
    baseY: number,
    lineHeight: number,
    bias: number,
    span: PositionedSegment,
    paddingLeft: number
) {
    let fill = theme.textDark;
    if (span.segment.variant === "removed") {
        fill = span.segment.color ?? removedColor(theme);
    } else if (span.segment.variant === "added") {
        fill = span.segment.color ?? addedColor(theme);
    }

    ctx.fillStyle = fill;
    const centerY = baseY + span.line * lineHeight + lineHeight / 2;
    const drawY = centerY + bias;
    const drawX = paddingLeft + span.x;
    ctx.fillText(span.text, drawX, drawY);

    if (span.segment.variant === "removed") {
        const metrics = ctx.measureText(span.text);
        const midline = centerY - 4;
        const offset = Math.max(1, Math.floor(metrics.actualBoundingBoxAscent / 10)) + 1;
        ctx.strokeStyle = addedColor(theme);

        ctx.beginPath();
        ctx.moveTo(drawX, midline - offset);
        ctx.lineTo(drawX + metrics.width, midline - offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(drawX, midline + offset);
        ctx.lineTo(drawX + metrics.width, midline + offset);
        ctx.stroke();
    }
}

function drawInline(args: DrawArgs<HistoryDiffCell>, cell: HistoryDiffCell, rect: Rectangle) {
    const { ctx, theme } = args;
    const availableWidth = Math.max(0, rect.width - theme.cellHorizontalPadding * 2);
    if (availableWidth <= 0) return;

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const emHeight = getEmHeight(ctx, theme.baseFontFull);
    const lineHeight = Math.max(emHeight, theme.lineHeight * emHeight);
    const bias = getMiddleCenterBias(ctx, theme);

    const { spans, lineCount } = layoutSegments(ctx, cell.data.data, availableWidth);

    if (lineCount === 0) return;

    const totalHeight = lineCount * lineHeight + theme.cellVerticalPadding * 2;
    const needsClip = totalHeight > rect.height + 0.5;
    if (needsClip) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip();
    }

    const baseY = rect.y + theme.cellVerticalPadding;
    const paddingLeft = rect.x + theme.cellHorizontalPadding;
    for (const span of spans) {
        drawSegment(ctx, theme, baseY, lineHeight, bias, span, paddingLeft);
    }

    if (needsClip) {
        ctx.restore();
    }
}

function drawStacked(args: DrawArgs<HistoryDiffCell>, cell: HistoryDiffCell, rect: Rectangle) {
    drawInline(args, cell, rect);
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
        let currentLineWidth = 0;
        let maxLineWidth = 0;

        const finalizeLine = () => {
            if (currentLineWidth > maxLineWidth) {
                maxLineWidth = currentLineWidth;
            }
            currentLineWidth = 0;
        };

        for (const segment of cell.data.data) {
            if (segment.variant === BREAK_LINE) {
                finalizeLine();
                continue;
            }

            let remaining = segment.text.replace(/\r/g, "");
            while (remaining.length > 0) {
                const newlineIndex = remaining.indexOf("\n");
                const chunk = newlineIndex === -1 ? remaining : remaining.slice(0, newlineIndex);
                if (chunk.length > 0) {
                    currentLineWidth += ctx.measureText(chunk).width;
                }
                if (newlineIndex === -1) {
                    remaining = "";
                } else {
                    finalizeLine();
                    remaining = remaining.slice(newlineIndex + 1);
                }
            }
        }

        finalizeLine();
        ctx.restore();
        return maxLineWidth + theme.cellHorizontalPadding * 2;
    },
    provideEditor: () => undefined,
};

export function measureHistoryDiffCellHeight(
    ctx: CanvasRenderingContext2D,
    theme: FullTheme,
    cell: HistoryDiffCell,
    availableWidth: number
): number {
    const emHeight = getEmHeight(ctx, theme.baseFontFull);
    if (availableWidth <= 0) {
        return emHeight + theme.cellVerticalPadding * 2;
    }
    const lineHeight = Math.max(emHeight, theme.lineHeight * emHeight);

    const layout = layoutSegments(ctx, cell.data.data, availableWidth);
    const lines = Math.max(layout.lineCount, 1);
    const total = lines * lineHeight + theme.cellVerticalPadding * 2;
    return Math.max(total, lineHeight + theme.cellVerticalPadding * 2);
}

export function createHistoryDiffCell(data: HistoryDiffCellData): HistoryDiffCell {
    const textForCopy =
        data.copyData ?? data.data.map(segment => (segment.variant === BREAK_LINE ? "\n" : segment.text)).join("");

    return {
        kind: GridCellKindEnum.Custom,
        data,
        copyData: textForCopy,
        allowOverlay: false,
        readonly: true,
    };
}
