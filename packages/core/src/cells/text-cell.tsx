/* eslint-disable react/display-name */
import * as React from "react";
import { GrowingEntry } from "../internal/growing-entry/growing-entry.js";
import { drawTextCell, prepTextCell } from "../internal/data-grid/render/data-grid-lib.js";
import { GridCellKind, type TextCell } from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";
import { drawEditHoverIndicator } from "../internal/data-grid/render/draw-edit-hover-indicator.js";

export const textCellRenderer: InternalCellRenderer<TextCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Text,
    needsHover: textCell => textCell.hoverEffect === true,
    needsHoverPosition: false,
    drawPrep: prepTextCell,
    useLabel: true,
    draw: a => {
        const { cell, hoverAmount, hyperWrapping, ctx, rect, theme, overrideCursor } = a;
        const { displayData, contentAlign, hoverEffect, allowWrapping, hoverEffectTheme } = cell;
        if (hoverEffect === true && hoverAmount > 0) {
            drawEditHoverIndicator(ctx, theme, hoverEffectTheme, displayData, rect, hoverAmount, overrideCursor);
        }
        drawTextCell(a, displayData, contentAlign, allowWrapping, hyperWrapping);
    },
    measure: (ctx, cell, t) => {
        if (cell.allowWrapping === false) {
            // When wrapping disabled, return full text width (expand column to fit)
            const lines = cell.displayData.split("\n", 1);
            let maxLineWidth = 0;
            for (const line of lines) {
                maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
            }
            return maxLineWidth + 2 * t.cellHorizontalPadding;
        }

        // When wrapping enabled, return preferred width (not required width)
        // This prevents columns from expanding to fit all text on one line

        // Find longest word to avoid breaking words
        const words = cell.displayData.split(/\s+/);
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

        return cappedWidth + 2 * t.cellHorizontalPadding;
    },
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: cell => ({
        disablePadding: cell.allowWrapping !== false,
        editor: p => {
            const { isHighlighted, onChange, value, validatedSelection, selectionBehavior } = p;
            return (
                <GrowingEntry
                    style={cell.allowWrapping !== false ? { padding: "3px 8.5px" } : undefined}
                    highlight={isHighlighted}
                    selectionBehavior={selectionBehavior}
                    autoFocus={value.readonly !== true}
                    disabled={value.readonly === true}
                    altNewline={true}
                    value={value.data}
                    validatedSelection={validatedSelection}
                    contentAlign={value.contentAlign}
                    onChange={e =>
                        onChange({
                            ...value,
                            data: e.target.value,
                        })
                    }
                />
            );
        },
    }),
    onPaste: (toPaste, cell, details) =>
        toPaste === cell.data
            ? undefined
            : { ...cell, data: toPaste, displayData: details.formattedString ?? cell.displayData },
};
