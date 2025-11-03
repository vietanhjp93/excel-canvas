import React from "react";
import { GrowingEntry } from "../internal/growing-entry/growing-entry.js";
import { drawTextCell, prepTextCell } from "../internal/data-grid/render/data-grid-lib.js";
import { GridCellKind, type RowIDCell } from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";

export const rowIDCellRenderer: InternalCellRenderer<RowIDCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.RowID,
    needsHover: false,
    needsHoverPosition: false,
    drawPrep: (a, b) => prepTextCell(a, b, a.theme.textLight),
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign, a.cell.allowWrapping, a.hyperWrapping),
    measure: (ctx, cell, theme) => {
        const lines = cell.data.split("\n", cell.allowWrapping !== false ? undefined : 1);
        let maxLineWidth = 0;
        for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }

        // ✅ Cap width only for very long text (when wrapping enabled)
        if (cell.allowWrapping !== false && maxLineWidth > 500) {
            // Find longest word to avoid breaking words
            const words = cell.data.split(/\s+/);
            let longestWord = 0;
            for (const word of words) {
                longestWord = Math.max(longestWord, ctx.measureText(word).width);
            }

            // Cap at 500px, but ensure longest word fits
            return Math.max(longestWord, Math.min(maxLineWidth, 500)) + 2 * theme.cellHorizontalPadding;
        }

        return maxLineWidth + 2 * theme.cellHorizontalPadding;
    },
    // eslint-disable-next-line react/display-name
    provideEditor: () => p => {
        const { isHighlighted, onChange, value, validatedSelection, selectionBehavior } = p;
        return (
            <GrowingEntry
                highlight={isHighlighted}
                selectionBehavior={selectionBehavior}
                autoFocus={value.readonly !== true}
                disabled={value.readonly !== false}
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
    onPaste: () => undefined,
};
