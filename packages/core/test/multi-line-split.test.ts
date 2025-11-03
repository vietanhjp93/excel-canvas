import { describe, it, expect, beforeEach } from "vitest";
import { splitMultilineText, clearMultilineCache } from "../src/internal/data-grid/render/multi-line-split.js";

describe("splitMultilineText", () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    const font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    beforeEach(() => {
        // Clear cache before each test
        clearMultilineCache();

        // Create canvas context
        canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Failed to get 2d context");
        ctx = context;
        ctx.font = font;
    });

    it("should split long text into multiple lines when width is small", () => {
        const text = "1flda sjfd lkfja ljakd fafdfsd afdaf dasf dafd fad";
        const width = 150;

        const lines = splitMultilineText(ctx, text, font, width, false);

        console.log("\n=== Test: Long text with 150px width ===");
        console.log(`Input: "${text}"`);
        console.log(`Width: ${width}px`);
        console.log(`Result lines: ${lines.length}`);
        lines.forEach((line, i) => {
            const lineWidth = ctx.measureText(line).width;
            console.log(`  ${i + 1}. "${line}" (${lineWidth.toFixed(1)}px)`);
        });

        // Should split into multiple lines
        expect(lines.length).toBeGreaterThan(1);

        // Each line should fit within width (with small tolerance for rounding)
        lines.forEach((line, i) => {
            const lineWidth = ctx.measureText(line).width;
            expect(lineWidth).toBeLessThanOrEqual(width + 1); // +1 for rounding
        });

        // All lines concatenated should equal original text (trimmed)
        const reconstructed = lines.join(" ").replace(/\s+/g, " ").trim();
        const original = text.replace(/\s+/g, " ").trim();
        expect(reconstructed).toBe(original);
    });

    it("should keep text on single line when width is large enough", () => {
        const text = "Short text";
        const width = 500;

        const lines = splitMultilineText(ctx, text, font, width, false);

        console.log("\n=== Test: Short text with large width ===");
        console.log(`Input: "${text}"`);
        console.log(`Width: ${width}px`);
        console.log(`Result lines: ${lines.length}`);

        // Should stay on single line
        expect(lines.length).toBe(1);
        expect(lines[0]).toBe(text);
    });

    it("should handle very narrow widths", () => {
        const text = "1flda sjfd lkfja ljakd fafdfsd afdaf dasf dafd fad";
        const width = 80;

        const lines = splitMultilineText(ctx, text, font, width, false);

        console.log("\n=== Test: Long text with 80px width ===");
        console.log(`Input: "${text}"`);
        console.log(`Width: ${width}px`);
        console.log(`Result lines: ${lines.length}`);
        lines.forEach((line, i) => {
            const lineWidth = ctx.measureText(line).width;
            console.log(`  ${i + 1}. "${line}" (${lineWidth.toFixed(1)}px)`);
        });

        // Should split into many lines
        expect(lines.length).toBeGreaterThan(3);

        // Each line should fit
        lines.forEach((line) => {
            const lineWidth = ctx.measureText(line).width;
            expect(lineWidth).toBeLessThanOrEqual(width + 1);
        });
    });

    it("should handle text with newlines", () => {
        const text = "Line 1 with some text\nLine 2 with more text";
        const width = 150;

        const lines = splitMultilineText(ctx, text, font, width, false);

        console.log("\n=== Test: Text with newlines ===");
        console.log(`Input: "${text}"`);
        console.log(`Result lines: ${lines.length}`);
        lines.forEach((line, i) => {
            console.log(`  ${i + 1}. "${line}"`);
        });

        // Should have at least 2 lines (due to \n)
        expect(lines.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle cache correctly", () => {
        const text = "Test text for caching";
        const width = 150;

        // First call
        const lines1 = splitMultilineText(ctx, text, font, width, false);

        // Second call with same params - should use cache
        const lines2 = splitMultilineText(ctx, text, font, width, false);

        // Should return same result
        expect(lines1).toEqual(lines2);

        // Different width - should NOT use cache
        const lines3 = splitMultilineText(ctx, text, font, 200, false);

        // May have different number of lines
        expect(lines3.length).toBeLessThanOrEqual(lines1.length);
    });

    it("should handle the exact case from user bug report", () => {
        const text = "1flda sjfd lkfja ljakd fafdfsd afdaf dasf dafd fad";
        const widths = [150, 149, 143, 141];

        widths.forEach((width) => {
            const lines = splitMultilineText(ctx, text, font, width, false);

            console.log(`\n=== Width ${width}px ===`);
            console.log(`Lines: ${lines.length}`);
            lines.forEach((line, i) => {
                const lineWidth = ctx.measureText(line).width;
                console.log(`  ${i + 1}. "${line}" (${lineWidth.toFixed(1)}px)`);
            });

            // Critical: should NOT be 1 line for such a long text at narrow width
            expect(lines.length).toBeGreaterThan(1);

            // Each line must fit
            lines.forEach((line) => {
                const lineWidth = ctx.measureText(line).width;
                expect(lineWidth).toBeLessThanOrEqual(width + 1);
            });
        });
    });
});
