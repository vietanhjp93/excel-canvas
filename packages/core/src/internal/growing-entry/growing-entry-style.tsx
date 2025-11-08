import { styled } from "@linaria/react";

export const InputBox = styled.textarea<{ contentAlign?: "left" | "right" | "center" }>`
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;

    border-radius: 0px;

    resize: none;
    white-space: pre-wrap;
    word-wrap: break-word;
    min-width: 100%;
    overflow: hidden;
    overflow-wrap: break-word;
    border: 0;
    background-color: transparent;

    ::placeholder {
        color: var(--gdg-text-light);
    }

    font-size: var(--gdg-editor-font-size);
    line-height: 16px;
    font-family: var(--gdg-font-family);
    -webkit-text-fill-color: var(--gdg-text-dark);
    color: var(--gdg-text-dark);
    padding: 0;
    padding-bottom: 2px;
    margin: 0;

    text-align: ${p => p.contentAlign ?? "left"};

    .gdg-invalid & {
        text-decoration: underline;
        text-decoration-color: #d60606;
    }
`;

export const ShadowBox = styled.div<{ contentAlign?: "left" | "right" | "center" }>`
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;

    width: max-content;
    max-width: 100%;

    min-width: 100%;

    font-size: var(--gdg-editor-font-size);
    line-height: 16px;
    font-family: var(--gdg-font-family);
    color: var(--gdg-text-dark);
    padding: 0;
    padding-bottom: 2px;
    margin: 0;

    text-align: ${p => p.contentAlign ?? "left"};
`;

export const GrowingEntryStyle = styled.div`
    position: relative;
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
`;
