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
        const lines = cell.displayData.split("\n", cell.allowWrapping !== false ? undefined : 1);
        let maxLineWidth = 0;
        for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }

        // ✅ Cap width only for very long text (when wrapping enabled)
        if (cell.allowWrapping !== false && maxLineWidth > 500) {
            // Find longest word to avoid breaking words
            const words = cell.displayData.split(/\s+/);
            let longestWord = 0;
            for (const word of words) {
                longestWord = Math.max(longestWord, ctx.measureText(word).width);
            }

            // Cap at 500px, but ensure longest word fits
            return Math.max(longestWord, Math.min(maxLineWidth, 500)) + 2 * t.cellHorizontalPadding;
        }

        return maxLineWidth + 2 * t.cellHorizontalPadding;
    },
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: cell => ({
        disablePadding: cell.allowWrapping !== false,
        editor: p => {
            const { isHighlighted, onChange, value, validatedSelection, selectionBehavior, activation } = p;
            // Get the activation key if editor was triggered by keyboard
            const activationKey = activation?.inputType === "keyboard" ? activation.key : undefined;
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
                    activationKey={activationKey}
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
