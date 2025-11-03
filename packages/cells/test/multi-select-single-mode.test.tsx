import * as React from "react";

import { getByText, getByRole, fireEvent, render, cleanup } from "@testing-library/react";
import { vi, expect, describe, it, afterEach } from "vitest";

import { GridCellKind } from "@glideapps/glide-data-grid";
import renderer, { type MultiSelectCell } from "../src/cells/multi-select-cell.js";
import { selectOption } from "./multi-select-cell.test.js";

describe("Multi Select Cell - Single Select Mode", () => {
    afterEach(cleanup);

    function getMockCell(props: Partial<MultiSelectCell> = {}): MultiSelectCell {
        return {
            kind: GridCellKind.Custom,
            allowOverlay: true,
            copyData: "",
            readonly: false,
            ...props,
            data: {
                kind: "multi-select-cell",
                options: [
                    { value: "option1", label: "Option 1", color: "red" },
                    { value: "option2", label: "Option 2", color: "blue" },
                    { value: "option3", label: "Option 3", color: "green" },
                ],
                values: [],
                allowMultiSelect: false, // Single select mode
                ...(props?.data ?? {}),
            },
        };
    }

    it("renders in single select mode", async () => {
        // @ts-ignore
        const Editor = renderer.provideEditor?.({
            ...getMockCell(),
            location: [0, 0],
        }).editor;
        if (Editor === undefined) {
            throw new Error("Editor is invalid");
        }

        const mockCellOnChange = vi.fn();
        const result = render(<Editor isHighlighted={false} value={getMockCell()} onChange={mockCellOnChange} />);
        const cellEditor = result.getByTestId("multi-select-cell");
        expect(cellEditor).toBeDefined();
    });

    it("allows selecting only one value in single select mode", async () => {
        const mockCell = getMockCell();
        // @ts-ignore
        const Editor = renderer.provideEditor?.({
            ...mockCell,
            location: [0, 0],
        }).editor;
        if (Editor === undefined) {
            throw new Error("Editor is invalid");
        }

        const mockCellOnChange = vi.fn();
        const result = render(<Editor isHighlighted={false} value={mockCell} onChange={mockCellOnChange} />);
        const cellEditor = result.getByTestId("multi-select-cell");
        expect(cellEditor).toBeDefined();

        await selectOption(cellEditor, "Option 1");
        expect(mockCellOnChange).toHaveBeenCalledTimes(1);
        expect(mockCellOnChange).toBeCalledWith({
            ...mockCell,
            data: { ...mockCell.data, values: ["option1"] },
        });
    });

    it("replaces value when selecting another option in single select mode", async () => {
        const mockCell = getMockCell({ data: { values: ["option1"] } } as any);
        // @ts-ignore
        const Editor = renderer.provideEditor?.({
            ...mockCell,
            location: [0, 0],
        }).editor;
        if (Editor === undefined) {
            throw new Error("Editor is invalid");
        }

        const mockCellOnChange = vi.fn();
        const result = render(<Editor isHighlighted={false} value={mockCell} onChange={mockCellOnChange} />);
        const cellEditor = result.getByTestId("multi-select-cell");

        await selectOption(cellEditor, "Option 2");
        expect(mockCellOnChange).toHaveBeenCalled();
        // In single select mode, it should only have one value (the last selected)
        const lastCall = mockCellOnChange.mock.calls[mockCellOnChange.mock.calls.length - 1][0];
        expect(lastCall.data.values).toHaveLength(1);
        expect(lastCall.data.values).toContain("option2");
    });

    it("works with allowCreation in single select mode", async () => {
        const mockCell = getMockCell({ data: { allowCreation: true } } as any);
        // @ts-ignore
        const Editor = renderer.provideEditor?.({
            ...mockCell,
            location: [0, 0],
        }).editor;
        if (Editor === undefined) {
            throw new Error("Editor is invalid");
        }

        const mockCellOnChange = vi.fn();
        const result = render(<Editor isHighlighted={false} value={mockCell} onChange={mockCellOnChange} />);
        const cellEditor = result.getByTestId("multi-select-cell");
        expect(cellEditor).toBeDefined();

        // Should be able to select existing options
        await selectOption(cellEditor, "Option 1");
        expect(mockCellOnChange).toHaveBeenCalled();
    });

    it("onPaste only takes first value in single select mode", () => {
        const cellProps = {
            kind: "multi-select-cell" as const,
            values: [],
            options: [
                { value: "option1", label: "Option 1" },
                { value: "option2", label: "Option 2" },
            ],
            allowCreation: true,
            allowMultiSelect: false, // Single select mode
        };

        // @ts-ignore
        const result = renderer.onPaste("option1,option2,option3", cellProps);
        expect(result).toBeDefined();
        expect(result?.values).toHaveLength(1);
        expect(result?.values[0]).toBe("option1");
    });

    it("onPaste respects allowCreation in single select mode", () => {
        const cellProps = {
            kind: "multi-select-cell" as const,
            values: [],
            options: [
                { value: "option1", label: "Option 1" },
                { value: "option2", label: "Option 2" },
            ],
            allowCreation: false,
            allowMultiSelect: false, // Single select mode
        };

        // @ts-ignore - Paste a value not in options
        const result = renderer.onPaste("unknownOption", cellProps);
        expect(result).toBeUndefined();

        // @ts-ignore - Paste a valid option
        const result2 = renderer.onPaste("option1", cellProps);
        expect(result2).toBeDefined();
        expect(result2?.values).toHaveLength(1);
        expect(result2?.values[0]).toBe("option1");
    });
});
