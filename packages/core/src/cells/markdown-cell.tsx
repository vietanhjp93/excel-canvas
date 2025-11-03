/* eslint-disable react/display-name */
import * as React from "react";
import { MarkdownOverlayEditor } from "../internal/data-grid-overlay-editor/private/markdown-overlay-editor.js";
import { drawTextCell, prepTextCell } from "../internal/data-grid/render/data-grid-lib.js";
import { GridCellKind, type MarkdownCell } from "../internal/data-grid/data-grid-types.js";
import type { InternalCellRenderer } from "./cell-types.js";

export const markdownCellRenderer: InternalCellRenderer<MarkdownCell> = {
    getAccessibilityString: c => c.data?.toString() ?? "",
    kind: GridCellKind.Markdown,
    needsHover: false,
    needsHoverPosition: false,
    drawPrep: prepTextCell,
    measure: (ctx, cell, t) => {
        if (cell.allowWrapping === false) {
            // When wrapping disabled, return full text width (expand column to fit)
            const lines = cell.data.split("\n", 1);
            let maxLineWidth = 0;
            for (const line of lines) {
                maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
            }
            return maxLineWidth + 2 * t.cellHorizontalPadding;
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

        return cappedWidth + 2 * t.cellHorizontalPadding;
    },
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign, a.cell.allowWrapping, a.hyperWrapping),
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: () => p => {
        const { onChange, value, target, onFinishedEditing, markdownDivCreateNode, forceEditMode, validatedSelection } =
            p;
        return (
            <MarkdownOverlayEditor
                onFinish={onFinishedEditing}
                targetRect={target}
                value={value}
                validatedSelection={validatedSelection}
                onChange={e =>
                    onChange({
                        ...value,
                        data: e.target.value,
                    })
                }
                forceEditMode={forceEditMode}
                createNode={markdownDivCreateNode}
            />
        );
    },
    onPaste: (toPaste, cell) => (toPaste === cell.data ? undefined : { ...cell, data: toPaste }),
};
