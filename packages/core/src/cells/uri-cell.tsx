/* eslint-disable react/display-name */
import * as React from "react";
import UriOverlayEditor from "../internal/data-grid-overlay-editor/private/uri-overlay-editor.js";
import {
    drawTextCell,
    getMeasuredTextCache,
    getMiddleCenterBias,
    measureTextCached,
    prepTextCell,
} from "../internal/data-grid/render/data-grid-lib.js";
import {
    GridCellKind,
    type BaseGridCell,
    type Rectangle,
    type UriCell,
} from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";
import type { FullTheme } from "../common/styles.js";
import { pointInRect } from "../common/math.js";

function getTextRect(
    metrics: TextMetrics,
    rect: Rectangle,
    theme: FullTheme,
    contentAlign: BaseGridCell["contentAlign"]
): Rectangle {
    let x = theme.cellHorizontalPadding;
    const y = rect.height / 2 - metrics.actualBoundingBoxAscent / 2;
    const width = metrics.width;
    const height = metrics.actualBoundingBoxAscent;

    if (contentAlign === "right") {
        x = rect.width - width - theme.cellHorizontalPadding;
    } else if (contentAlign === "center") {
        x = rect.width / 2 - width / 2;
    }

    return { x, y, width, height };
}

function isOverLinkText(e: {
    readonly cell: UriCell;
    readonly posX: number;
    readonly posY: number;
    readonly bounds: Rectangle;
    readonly theme: FullTheme;
}): boolean {
    const { cell, bounds, posX, posY, theme } = e;
    const txt = cell.displayData ?? cell.data;
    if (cell.hoverEffect !== true || cell.onClickUri === undefined) return false;

    const m = getMeasuredTextCache(txt, theme.baseFontFull);
    if (m === undefined) return false;
    const textRect = getTextRect(m, bounds, theme, cell.contentAlign);
    return pointInRect(
        {
            x: textRect.x - 4,
            y: textRect.y - 4,
            width: textRect.width + 8,
            height: textRect.height + 8,
        },
        posX,
        posY
    );
}

export const uriCellRenderer: InternalCellRenderer<UriCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Uri,
    needsHover: uriCell => uriCell.hoverEffect === true,
    needsHoverPosition: true,
    useLabel: true,
    drawPrep: prepTextCell,
    draw: a => {
        const { cell, theme, overrideCursor, hoverX, hoverY, rect, ctx, hyperWrapping } = a;
        const txt = cell.displayData ?? cell.data;
        const isLinky = cell.hoverEffect === true;
        if (overrideCursor !== undefined && isLinky && hoverX !== undefined && hoverY !== undefined) {
            const m = measureTextCached(txt, ctx, theme.baseFontFull);
            const textRect = getTextRect(m, rect, theme, cell.contentAlign);

            const { x, y, width: w, height: h } = textRect;

            // check if hoverX and hoverY inside the box
            if (hoverX >= x - 4 && hoverX <= x - 4 + w + 8 && hoverY >= y - 4 && hoverY <= y - 4 + h + 8) {
                const middleCenterBias = getMiddleCenterBias(ctx, theme.baseFontFull);
                overrideCursor("pointer");
                const underlineOffset = 5;
                const drawY = y - middleCenterBias;

                ctx.beginPath();
                ctx.moveTo(rect.x + x, Math.floor(rect.y + drawY + h + underlineOffset) + 0.5);
                ctx.lineTo(rect.x + x + w, Math.floor(rect.y + drawY + h + underlineOffset) + 0.5);

                ctx.strokeStyle = theme.linkColor;
                ctx.stroke();

                ctx.save();
                ctx.fillStyle = a.cellFillColor;
                // ✅ Pass allowWrapping to all drawTextCell calls
                drawTextCell({ ...a, rect: { ...rect, x: rect.x - 1 } }, txt, cell.contentAlign, cell.allowWrapping, hyperWrapping);
                drawTextCell({ ...a, rect: { ...rect, x: rect.x - 2 } }, txt, cell.contentAlign, cell.allowWrapping, hyperWrapping);
                drawTextCell({ ...a, rect: { ...rect, x: rect.x + 1 } }, txt, cell.contentAlign, cell.allowWrapping, hyperWrapping);
                drawTextCell({ ...a, rect: { ...rect, x: rect.x + 2 } }, txt, cell.contentAlign, cell.allowWrapping, hyperWrapping);
                ctx.restore();
            }
        }

        ctx.fillStyle = isLinky ? theme.linkColor : theme.textDark;
        drawTextCell(a, txt, cell.contentAlign, cell.allowWrapping, hyperWrapping);
    },
    onSelect: e => {
        if (isOverLinkText(e)) {
            e.preventDefault();
        }
    },
    onClick: a => {
        const { cell } = a;
        const didClick = isOverLinkText(a);
        if (didClick) {
            cell.onClickUri?.(a);
        }
        return undefined;
    },
    measure: (ctx, cell, theme) => {
        const txt = cell.displayData ?? cell.data;

        if (cell.allowWrapping === false) {
            // When wrapping disabled, return full text width (expand column to fit)
            const lines = txt.split("\n", 1);
            let maxLineWidth = 0;
            for (const line of lines) {
                maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
            }
            return maxLineWidth + 2 * theme.cellHorizontalPadding;
        }

        // When wrapping enabled, return preferred width (not required width)
        // Find longest word to avoid breaking words
        const words = txt.split(/\s+/);
        let longestWord = 0;
        for (const word of words) {
            longestWord = Math.max(longestWord, ctx.measureText(word).width);
        }

        // Return reasonable preferred width: longest word or 200px, capped at 400px
        const minPreferredWidth = 200;
        const maxPreferredWidth = 400;
        const preferredContentWidth = Math.max(
            longestWord,
            Math.min(minPreferredWidth, maxPreferredWidth)
        );
        const cappedWidth = Math.min(preferredContentWidth, maxPreferredWidth);

        return cappedWidth + 2 * theme.cellHorizontalPadding;
    },
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: cell => p => {
        const { onChange, value, forceEditMode, validatedSelection } = p;
        return (
            <UriOverlayEditor
                forceEditMode={
                    value.readonly !== true &&
                    (forceEditMode || (cell.hoverEffect === true && cell.onClickUri !== undefined))
                }
                uri={value.data}
                preview={value.displayData ?? value.data}
                validatedSelection={validatedSelection}
                readonly={value.readonly === true}
                onChange={e =>
                    onChange({
                        ...value,
                        data: e.target.value,
                    })
                }
            />
        );
    },
    onPaste: (toPaste, cell, details) =>
        toPaste === cell.data
            ? undefined
            : { ...cell, data: toPaste, displayData: details.formattedString ?? cell.displayData },
};
