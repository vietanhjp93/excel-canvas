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
    draw: a => drawTextCell(a, a.cell.data, a.cell.contentAlign),
    measure: (ctx, cell, theme) => ctx.measureText(cell.data).width + theme.cellHorizontalPadding * 2,
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
