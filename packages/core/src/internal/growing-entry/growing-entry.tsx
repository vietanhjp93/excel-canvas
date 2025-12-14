import * as React from "react";

import { GrowingEntryStyle, ShadowBox, InputBox } from "./growing-entry-style.js";
import { assert } from "../../common/support.js";
import type { EditSelectionBehavior, SelectionRange } from "../data-grid/data-grid-types.js";

interface Props
    extends React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
    readonly placeholder?: string;
    readonly highlight: boolean;
    readonly altNewline?: boolean;
    readonly validatedSelection?: SelectionRange;
    readonly selectionBehavior?: EditSelectionBehavior;
    readonly contentAlign?: "left" | "right" | "center";
    // The key that triggered edit mode - will be dispatched to textarea after focus
    // This allows IME composition to work correctly for Japanese/Chinese/Korean input
    readonly activationKey?: string;
}

let globalInputID = 0;

/** @category Renderers */
export const GrowingEntry: React.FunctionComponent<Props> = (props: Props) => {
    const {
        placeholder,
        value,
        onKeyDown,
        highlight,
        altNewline,
        validatedSelection,
        selectionBehavior = "select-all",
        contentAlign,
        activationKey,
        ...rest
    } = props;
    const { onChange, className } = rest;

    const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

    const useText = value ?? "";

    assert(onChange !== undefined, "GrowingEntry must be a controlled input area");

    // 10 million id's aught to be enough for anybody
    const [inputID] = React.useState(() => "input-box-" + (globalInputID = (globalInputID + 1) % 10_000_000));

    React.useEffect(() => {
        const ta = inputRef.current;
        if (ta === null || ta.disabled) return;

        const length = useText.toString().length;
        let start = length;
        let end = length;
        if (validatedSelection === undefined) {
            switch (selectionBehavior) {
                case "select-all":
                    start = 0;
                    end = length;
                    break;
                case "start":
                    start = 0;
                    end = 0;
                    break;
                default:
                    start = length;
                    end = length;
                    break;
            }
        }

        ta.focus();
        ta.setSelectionRange(start, end);

        // If there's an activation key, insert it after focus
        // This allows IME composition to work correctly for Japanese/Chinese/Korean input
        if (activationKey !== undefined && activationKey.length === 1) {
            // Select all first so the activation key replaces existing content
            ta.setSelectionRange(0, ta.value.length);

            // Use execCommand to insert text - this triggers proper IME behavior
            // Note: execCommand is deprecated but still works and is the only reliable way
            // to insert text that properly interacts with IME composition
            const inserted = document.execCommand("insertText", false, activationKey);

            // Fallback for browsers where execCommand doesn't work
            if (!inserted) {
                // Manually set value and dispatch input event
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype,
                    "value"
                )?.set;
                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(ta, activationKey);
                    const inputEvent = new Event("input", { bubbles: true });
                    ta.dispatchEvent(inputEvent);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useLayoutEffect(() => {
        if (validatedSelection !== undefined) {
            const range = typeof validatedSelection === "number" ? [validatedSelection, null] : validatedSelection;
            inputRef.current?.setSelectionRange(range[0], range[1]);
        }
    }, [validatedSelection]);

    const onKeyDownInner = React.useCallback<NonNullable<typeof onKeyDown>>(
        e => {
            if (e.key === "Enter" && e.shiftKey && altNewline === true) {
                return;
            }
            onKeyDown?.(e);
        },
        [altNewline, onKeyDown]
    );

    return (
        <GrowingEntryStyle className="gdg-growing-entry">
            <ShadowBox className={className} contentAlign={contentAlign}>
                {useText + "\n"}
            </ShadowBox>
            <InputBox
                {...rest}
                className={(className ?? "") + " gdg-input"}
                id={inputID}
                ref={inputRef}
                onKeyDown={onKeyDownInner}
                value={useText}
                placeholder={placeholder}
                dir="auto"
                contentAlign={contentAlign}
            />
        </GrowingEntryStyle>
    );
};
