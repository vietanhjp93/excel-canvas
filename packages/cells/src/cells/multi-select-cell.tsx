import * as React from "react";

import {
    type CustomCell,
    type ProvideEditorCallback,
    type CustomRenderer,
    type Rectangle,
    type FullTheme,
    measureTextCached,
    getMiddleCenterBias,
    useTheme,
    GridCellKind,
    roundedRect,
    getLuminance,
    drawTextCell,
} from "excel-canvas";

import { styled } from "@linaria/react";
import Select, { type MenuProps, components, type StylesConfig } from "react-select";
import CreatableSelect from "react-select/creatable";

type SelectOption = { value: string; label?: string; color?: string };

interface MultiSelectCellProps {
    readonly kind: "multi-select-cell";
    /* The list of values of this cell. */
    readonly values: string[] | undefined | null;
    /* The list of possible options that can be selected.
    The options can be provided as a list of strings
    or as a list of objects with the following properties:
    - value: The value of this option.
    - label: The label of this option. If not provided, the value will be used as the label.
    - color: The color of this option. If not provided, the default color will be used. */
    readonly options?: readonly (SelectOption | string)[];
    /* If true, users can create new values that are not part of the configured options. */
    readonly allowCreation?: boolean;
    /* If true, users can select the same value multiple times. */
    readonly allowDuplicates?: boolean;
    /* If false, only one value can be selected at a time (single select mode).
    If true or undefined, multiple values can be selected (multi select mode). Default is true. */
    readonly allowMultiSelect?: boolean;
    /* If true, text will wrap to multiple lines (only applies in single-select mode). Default is true. */
    readonly allowWrapping?: boolean;
}

/* This prefix is used when allowDuplicates is enabled to make sure that
all underlying values are unique. */
const VALUE_PREFIX = "__value";
const VALUE_PREFIX_REGEX = new RegExp(`^${VALUE_PREFIX}\\d+__`);

const Wrap = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-top: auto;
    margin-bottom: auto;
    .gdg-multi-select {
        font-family: var(--gdg-font-family);
        font-size: var(--gdg-editor-font-size);
    }
`;

const PortalWrap = styled.div`
    font-family: var(--gdg-font-family);
    font-size: var(--gdg-editor-font-size);
    color: var(--gdg-text-dark);

    > div {
        border-radius: 4px;
        border: 1px solid var(--gdg-border-color);
    }
`;

/**
 * Prepares the options for usage with the react-select component.
 *
 * @param options The options to prepare.
 * @returns The prepared options in the format required by react-select.
 */
export const prepareOptions = (
    options: readonly (string | SelectOption)[]
): { value: string; label?: string; color?: string }[] => {
    return options.map(option => {
        if (typeof option === "string" || option === null || option === undefined) {
            return { value: option, label: option ?? "", color: undefined };
        }

        return {
            value: option.value,
            label: option.label ?? option.value ?? "",
            color: option.color ?? undefined,
        };
    });
};

/**
 * Resolve a list values to values compatible with react-select.
 * If allowDuplicates is true, the values will be prefixed with a numbered prefix to
 * make sure that all values are unique.
 *
 * @param values The values to resolve.
 * @param options The options to use for the resolution.
 * @param allowDuplicates If true, the values can contain duplicates.
 * @returns The list of values compatible with react-select.
 */
export const resolveValues = (
    values: string[] | null | undefined,
    options: readonly SelectOption[],
    allowDuplicates?: boolean
): { value: string; label?: string; color?: string }[] => {
    if (values === undefined || values === null) {
        return [];
    }

    return values.map((value, index) => {
        const valuePrefix = allowDuplicates ? `${VALUE_PREFIX}${index}__` : "";
        const matchedOption = options.find(option => {
            return option.value === value;
        });
        if (matchedOption) {
            return {
                ...matchedOption,
                value: `${valuePrefix}${matchedOption.value}`,
            };
        }
        return { value: `${valuePrefix}${value}`, label: value };
    });
};

interface CustomMenuProps extends MenuProps<any> {}

const CustomMenu: React.FC<CustomMenuProps> = p => {
    const { Menu } = components;
    const { children, ...rest } = p;
    return <Menu {...rest}>{children}</Menu>;
};

export type MultiSelectCell = CustomCell<MultiSelectCellProps>;

const Editor: ReturnType<ProvideEditorCallback<MultiSelectCell>> = p => {
    const { value: cell, initialValue, onChange, onFinishedEditing, portalElementRef } = p;
    const { options: optionsIn, values: valuesIn, allowCreation, allowDuplicates, allowMultiSelect = true } = cell.data;

    const theme = useTheme();
    const [value, setValue] = React.useState(valuesIn);
    const [menuOpen, setMenuOpen] = React.useState(true);
    const [inputValue, setInputValue] = React.useState(initialValue ?? "");

    const options = React.useMemo(() => {
        return prepareOptions(optionsIn ?? []);
    }, [optionsIn]);

    const menuDisabled = allowCreation && allowDuplicates && options.length === 0;

    // Prevent the grid from handling the keydown as long as the menu is open:
    // This allows usage of enter without triggering the grid to finish editing.
    const onKeyDown = React.useCallback(
        (e: React.KeyboardEvent) => {
            if (menuOpen) {
                e.stopPropagation();
            }
        },
        [menuOpen]
    );

    // Apply styles to the react-select component.
    // All components: https://react-select.com/components
    const colorStyles: StylesConfig<SelectOption, true> = {
        control: (base, state) => ({
            ...base,
            border: 0,
            boxShadow: "none",
            backgroundColor: theme.bgCell,
            // Allow interaction (e.g. wheel scrolling) even when the select is disabled
            pointerEvents: state.isDisabled ? "auto" : base.pointerEvents,
            cursor: state.isDisabled ? "default" : base.cursor,
        }),
        valueContainer: base => ({
            ...base,
            // Keep default wrapping so multiple chips can move to new lines
            flexWrap: base.flexWrap ?? "wrap",
            overflowX: "auto",
            overflowY: "hidden",
        }),
        menu: styles => ({
            ...styles,
            backgroundColor: theme.bgCell,
        }),
        option: (styles, state) => {
            return {
                ...styles,
                fontSize: theme.editorFontSize,
                fontFamily: theme.fontFamily,
                color: theme.textDark,
                ...(state.isFocused ? { backgroundColor: theme.accentLight, cursor: "pointer" } : {}),
                ":active": {
                    ...styles[":active"],
                    color: theme.accentFg,
                    backgroundColor: theme.accentColor,
                },
            };
        },
        input: (styles, { isDisabled }) => {
            if (isDisabled) {
                return {
                    display: "none",
                };
            }
            return {
                ...styles,
                fontSize: theme.editorFontSize,
                fontFamily: theme.fontFamily,
                color: theme.textDark,
            };
        },
        placeholder: styles => {
            return {
                ...styles,
                fontSize: theme.editorFontSize,
                fontFamily: theme.fontFamily,
                color: theme.textLight,
            };
        },
        noOptionsMessage: styles => {
            return {
                ...styles,
                fontSize: theme.editorFontSize,
                fontFamily: theme.fontFamily,
                color: theme.textLight,
            };
        },
        clearIndicator: styles => {
            return {
                ...styles,
                color: theme.textLight,
                ":hover": {
                    color: theme.textDark,
                    cursor: "pointer",
                },
            };
        },
        multiValue: (styles, { data }) => {
            return {
                ...styles,
                backgroundColor: data.color ?? theme.bgBubble,
                borderRadius: `${theme.roundingRadius ?? theme.bubbleHeight / 2}px`,
                flexShrink: 0,
                whiteSpace: "nowrap",
            };
        },
        multiValueLabel: (styles, { data, isDisabled }) => {
            return {
                ...styles,
                paddingRight: isDisabled ? theme.bubblePadding : 0,
                paddingLeft: theme.bubblePadding,
                paddingTop: 0,
                paddingBottom: 0,
                color: data.color
                    ? // If a color is set for this option,
                      // we use it to determine the text color.
                      getLuminance(data.color) > 0.5
                        ? "black"
                        : "white"
                    : theme.textBubble,
                fontSize: theme.editorFontSize,
                fontFamily: theme.fontFamily,
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
                height: theme.bubbleHeight,
                whiteSpace: "nowrap",
            };
        },
        multiValueRemove: (styles, { data, isDisabled, isFocused }) => {
            if (isDisabled) {
                return {
                    display: "none",
                };
            }
            return {
                ...styles,
                color: data.color
                    ? // If a color is set for this option,
                      // we use it to determine the text color.
                      getLuminance(data.color) > 0.5
                        ? "black"
                        : "white"
                    : theme.textBubble,
                backgroundColor: undefined,
                borderRadius: isFocused ? `${theme.roundingRadius ?? theme.bubbleHeight / 2}px` : undefined,
                ":hover": {
                    cursor: "pointer",
                },
            };
        },
    };

    // This is used to submit the values to the grid.
    const submitValues = React.useCallback(
        (values: string[]) => {
            // Change the list of values to the actual values by removing the prefix.
            // This is only relevant in the case of allowDuplicates being true.
            const mappedValues = values.map(v => {
                return allowDuplicates && v.startsWith(VALUE_PREFIX)
                    ? v.replace(new RegExp(VALUE_PREFIX_REGEX), "")
                    : v;
            });
            setValue(mappedValues);
            onChange({
                ...cell,
                data: {
                    ...cell.data,
                    values: mappedValues,
                },
            });
        },
        [cell, onChange, allowDuplicates]
    );

    const handleKeyDown: React.KeyboardEventHandler = event => {
        switch (event.key) {
            case "Enter":
            case "Tab":
                if (!inputValue) {
                    // If the user pressed enter or tab without entering anything,
                    // we finish editing based on the current state.
                    // ✅ FIX: Use local state value instead of prop cell
                    onFinishedEditing({
                        ...cell,
                        data: {
                            ...cell.data,
                            values: value ?? [],
                        },
                    }, [0, 1]);
                    return;
                }

                if (allowDuplicates && allowCreation) {
                    // This is a workaround to allow the user to enter new values
                    // multiple times.
                    setInputValue("");
                    submitValues([...(value ?? []), inputValue]);
                    setMenuOpen(false);
                    event.preventDefault();
                }
        }
    };

    const SelectComponent = allowCreation ? CreatableSelect : Select;
    return (
        <Wrap onKeyDown={onKeyDown} data-testid={"multi-select-cell"}>
            <SelectComponent
                className="gdg-multi-select"
                isMulti={allowMultiSelect}
                isDisabled={cell.readonly}
                isClearable={true}
                isSearchable={true}
                inputValue={inputValue}
                onInputChange={setInputValue}
                options={options}
                placeholder={cell.readonly ? "" : allowCreation ? "Add..." : undefined}
                noOptionsMessage={input => {
                    return allowCreation && allowDuplicates && input.inputValue
                        ? `Create "${input.inputValue}"`
                        : undefined;
                }}
                menuIsOpen={cell.readonly ? false : menuOpen}
                onMenuOpen={() => setMenuOpen(true)}
                onMenuClose={() => setMenuOpen(false)}
                value={resolveValues(value, options, allowDuplicates)}
                onKeyDown={cell.readonly ? undefined : handleKeyDown}
                menuPlacement={"auto"}
                menuPortalTarget={portalElementRef?.current ?? document.getElementById("portal")}
                autoFocus={true}
                openMenuOnFocus={true}
                openMenuOnClick={true}
                closeMenuOnSelect={allowMultiSelect ? true : true}
                backspaceRemovesValue={true}
                escapeClearsValue={false}
                styles={colorStyles}
                components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    Menu: props => {
                        if (menuDisabled) {
                            return null;
                        }
                        return (
                            <PortalWrap>
                                <CustomMenu className={"click-outside-ignore"} {...props} />
                            </PortalWrap>
                        );
                    },
                }}
                onChange={async e => {
                    if (e === null) {
                        return;
                    }
                    // Handle both single and multi select
                    let newValues: string[];
                    if (allowMultiSelect) {
                        // Multi select: e is an array
                        if (Array.isArray(e)) {
                            newValues = e.map(x => x.value);
                        } else {
                            newValues = [];
                        }
                    } else {
                        // Single select: e is a single object
                        if (Array.isArray(e)) {
                            // In case react-select returns array even in single mode
                            newValues = e.length > 0 ? [e[e.length - 1].value] : [];
                        } else {
                            // Single object
                            newValues = [(e as any).value];
                        }
                    }
                    submitValues(newValues);

                    // Auto finish editing in single select mode after selection
                    // ✅ FIX: Use updated cell with new values instead of prop cell
                    if (!allowMultiSelect && newValues.length > 0) {
                        onFinishedEditing({
                            ...cell,
                            data: {
                                ...cell.data,
                                values: newValues,
                            },
                        }, [0, 1]);
                    }
                }}
            />
        </Wrap>
    );
};

const renderer: CustomRenderer<MultiSelectCell> = {
    kind: GridCellKind.Custom,
    isMatch: (c): c is MultiSelectCell => (c.data as any).kind === "multi-select-cell",
    draw: (args, cell) => {
        const { ctx, theme, rect, highlighted } = args;
        const { values, options: optionsIn, allowMultiSelect = true, allowWrapping } = cell.data;

        if (values === undefined || values === null) {
            return true;
        }

        const options = prepareOptions(optionsIn ?? []);

        // Single select mode: draw as text cell with wrapping support
        if (!allowMultiSelect) {
            if (values.length === 0) {
                return true;
            }
            const matchedOption = options.find(opt => opt.value === values[0]);
            const displayText = matchedOption?.label ?? values[0];
            drawTextCell(args, displayText, cell.contentAlign, allowWrapping);
            return true;
        }

        // Multi select mode: draw as bubbles with auto-wrapping
        const drawArea: Rectangle = {
            x: rect.x + theme.cellHorizontalPadding,
            y: rect.y + theme.cellVerticalPadding,
            width: rect.width - 2 * theme.cellHorizontalPadding,
            height: rect.height - 2 * theme.cellVerticalPadding,
        };

        // Pre-calculate required rows by simulating layout
        let simulateX = 0;
        let requiredRows = 1;
        for (const value of values) {
            const matchedOption = options.find(t => t.value === value);
            const displayText = matchedOption?.label ?? value;
            const metrics = measureTextCached(displayText, ctx);
            const width = metrics.width + theme.bubblePadding * 2;

            // Check if bubble fits on current row
            if (simulateX > 0 && simulateX + width > drawArea.width) {
                requiredRows++;
                simulateX = 0;
            }
            simulateX += width + theme.bubbleMargin;
        }

        let { x } = drawArea;
        let row = 1;

        // Calculate starting Y position with proper vertical centering
        const contentHeight = requiredRows * theme.bubbleHeight + (requiredRows - 1) * theme.bubblePadding;
        let y = drawArea.y + Math.max(0, (drawArea.height - contentHeight) / 2);

        for (const value of values) {
            const matchedOption = options.find(t => t.value === value);
            const color = matchedOption?.color ?? (highlighted ? theme.bgBubbleSelected : theme.bgBubble);
            const displayText = matchedOption?.label ?? value;
            const metrics = measureTextCached(displayText, ctx);
            const width = metrics.width + theme.bubblePadding * 2;
            const textY = theme.bubbleHeight / 2;

            // Wrap to next line if bubble doesn't fit (no row limit!)
            if (x !== drawArea.x && x + width > drawArea.x + drawArea.width) {
                row++;
                y += theme.bubbleHeight + theme.bubblePadding;
                x = drawArea.x;
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            roundedRect(ctx, x, y, width, theme.bubbleHeight, theme.roundingRadius ?? theme.bubbleHeight / 2);
            ctx.fill();

            // If a color is set for this option, we use either black or white as the text color depending on the background.
            // Otherwise, use the configured textBubble color.
            ctx.fillStyle = matchedOption?.color
                ? getLuminance(color) > 0.5
                    ? "#000000"
                    : "#ffffff"
                : theme.textBubble;
            ctx.fillText(displayText, x + theme.bubblePadding, y + textY + getMiddleCenterBias(ctx, theme));

            x += width + theme.bubbleMargin;

            // Stop rendering if we've exceeded the available height
            if (y + theme.bubbleHeight > drawArea.y + drawArea.height) {
                break;
            }
        }

        return true;
    },
    measure: (ctx, cell, theme) => {
        const { values, options, allowMultiSelect = true, allowWrapping } = cell.data;

        if (!values) {
            return theme.cellHorizontalPadding * 2;
        }

        // Single select mode: measure as text with wrapping support
        if (!allowMultiSelect) {
            if (values.length === 0) {
                return theme.cellHorizontalPadding * 2;
            }
            const matchedOption = prepareOptions(options ?? []).find(opt => opt.value === values[0]);
            const displayText = matchedOption?.label ?? values[0];
            // ✅ Support allowWrapping: measure all lines if wrapping enabled
            const lines = displayText.split("\n", allowWrapping !== false ? undefined : 1);
            let maxLineWidth = 0;
            for (const line of lines) {
                maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
            }
            return maxLineWidth + theme.cellHorizontalPadding * 2;
        }

        // Multi select mode: measure bubbles
        // Resolve the values to the actual display labels:
        const labels = resolveValues(values, prepareOptions(options ?? []), cell.data.allowDuplicates).map(
            x => x.label ?? x.value
        );

        const bubblesWidth = labels.reduce(
            (acc, data) => ctx.measureText(data).width + acc + theme.bubblePadding * 2 + theme.bubbleMargin,
            0
        );

        if (labels.length === 0) {
            return theme.cellHorizontalPadding * 2;
        }

        return bubblesWidth + 2 * theme.cellHorizontalPadding - theme.bubbleMargin;
    },
    provideEditor: () => ({
        editor: Editor,
        disablePadding: true,
        deletedValue: v => ({
            ...v,
            copyData: "",
            data: {
                ...v.data,
                values: [],
            },
        }),
    }),
    onPaste: (val: string, cell: MultiSelectCellProps) => {
        const { allowMultiSelect = true } = cell;
        
        if (!val || !val.trim()) {
            // Empty values should result in empty strings
            return {
                ...cell,
                values: [],
            };
        }
        let values = val.split(",").map(s => s.trim());

        if (!cell.allowDuplicates) {
            // Remove all duplicates
            values = values.filter((v, index) => values.indexOf(v) === index);
        }

        if (!cell.allowCreation) {
            // Only allow values that are part of the options:
            const options = prepareOptions(cell.options ?? []);
            values = values.filter(v => options.find(o => o.value === v));
        }

        // Single select mode: only keep the first value
        if (!allowMultiSelect && values.length > 0) {
            values = [values[0]];
        }

        if (values.length === 0) {
            // We were not able to parse any values, return undefined to
            // not change the cell value.
            return undefined;
        }
        return {
            ...cell,
            values,
        };
    },
};

export default renderer;

/**
 * Type guard to check if a cell is a multi-select cell
 */
export function isMultiSelectCell(cell: CustomCell): cell is MultiSelectCell {
    return (cell.data as any).kind === "multi-select-cell";
}

/**
 * Measures the required height for a multi-select cell with bubble wrapping.
 * This function simulates the bubble layout algorithm to pre-calculate how many rows
 * are needed to display all bubbles, enabling proper auto row height calculation.
 *
 * @param ctx Canvas rendering context for text measurement
 * @param theme Theme configuration with bubble styling
 * @param cell The multi-select cell to measure
 * @param availableWidth The available width for the cell content (excluding padding)
 * @returns The required height in pixels
 */
export function measureMultiSelectCellHeight(
    ctx: CanvasRenderingContext2D,
    theme: FullTheme,
    cell: MultiSelectCell,
    availableWidth: number
): number {
    const { values, options: optionsIn, allowMultiSelect = true } = cell.data;

    // Default height for empty or single-select cells
    if (!values || values.length === 0 || !allowMultiSelect) {
        return theme.cellVerticalPadding * 2 + theme.bubbleHeight;
    }

    const options = prepareOptions(optionsIn ?? []);
    const labels = resolveValues(values, options, cell.data.allowDuplicates).map(
        x => x.label ?? x.value
    );

    // Simulate bubble layout to count required rows
    let x = 0;
    let rows = 1;

    for (const label of labels) {
        const metrics = ctx.measureText(label);
        const bubbleWidth = metrics.width + theme.bubblePadding * 2;

        // Check if bubble fits on current row
        if (x > 0 && x + bubbleWidth > availableWidth) {
            // Move to next row
            rows++;
            x = 0;
        }

        x += bubbleWidth + theme.bubbleMargin;
    }

    // Calculate total height based on rows
    const totalBubbleHeight = rows * theme.bubbleHeight + (rows - 1) * theme.bubblePadding;
    return totalBubbleHeight + theme.cellVerticalPadding * 2;
}
