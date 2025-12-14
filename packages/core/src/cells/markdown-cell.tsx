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
            return Math.max(longestWord, Math.min(maxLineWidth, 500)) + 2 * t.cellHorizontalPadding;
        }

        return maxLineWidth + 2 * t.cellHorizontalPadding;
    },
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign, a.cell.allowWrapping, a.hyperWrapping),
    onDelete: c => ({
        ...c,
        data: "",
    }),
    provideEditor: () => p => {
        const { onChange, value, target, onFinishedEditing, markdownDivCreateNode, forceEditMode, validatedSelection, activation } =
            p;
        const activationKey = activation?.inputType === "keyboard" ? activation.key : undefined;
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
                activationKey={activationKey}
            />
        );
    },
    onPaste: (toPaste, cell) => (toPaste === cell.data ? undefined : { ...cell, data: toPaste }),
};
