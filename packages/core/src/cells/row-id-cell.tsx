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
        if (cell.allowWrapping === false) {
            // When wrapping disabled, return full text width (expand column to fit)
            const lines = cell.data.split("\n", 1);
            let maxLineWidth = 0;
            for (const line of lines) {
                maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
            }
            return maxLineWidth + 2 * theme.cellHorizontalPadding;
        }

        // When wrapping enabled, return preferred width (not required width)
        // Find longest word to avoid breaking words
        const words = cell.data.split(/\s+/);
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
