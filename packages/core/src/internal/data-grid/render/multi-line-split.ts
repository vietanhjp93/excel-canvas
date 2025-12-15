// This module is a lightly modified copy of canvas-hypertxt's splitMultilineText helper.
// The original implementation aggressively trimmed the start of every line after the
// first, which caused leading indentation to be lost. We keep the trimming logic for
// trailing whitespace only so multi-line cells can preserve intentional leading spaces.

const resultCache: Map<string, readonly string[]> = new Map();

// font -> avg pixels per char
const metrics: Map<string, { count: number; size: number }> = new Map();

const hyperMaps: Map<string, Map<string, number>> = new Map();

// Track average width for fullwidth characters (全角) separately
// In Japanese, characters are either fullwidth (全角) or halfwidth (半角)
// All fullwidth chars have the same width, all halfwidth chars have the same width
const fullwidthAvgSize: Map<string, number> = new Map();

type BreakCallback = (str: string) => readonly number[];

// Check if a character is fullwidth (全角)
// Fullwidth characters are approximately 2x the width of halfwidth characters
function isFullwidthChar(char: string): boolean {
    const code = char.codePointAt(0) ?? 0;
    return (
        // CJK characters (always fullwidth)
        (code >= 0x30_00 && code <= 0x30_3F) || // CJK Punctuation and Symbols
        (code >= 0x30_40 && code <= 0x30_9F) || // Hiragana
        (code >= 0x30_A0 && code <= 0x30_FF) || // Katakana
        (code >= 0x31_00 && code <= 0x31_2F) || // Bopomofo
        (code >= 0x31_F0 && code <= 0x31_FF) || // Katakana Phonetic Extensions
        (code >= 0x32_00 && code <= 0x32_FF) || // Enclosed CJK Letters
        (code >= 0x33_00 && code <= 0x33_FF) || // CJK Compatibility
        (code >= 0x34_00 && code <= 0x4D_BF) || // CJK Unified Ideographs Extension A
        (code >= 0x4E_00 && code <= 0x9F_FF) || // CJK Unified Ideographs
        (code >= 0xF9_00 && code <= 0xFA_FF) || // CJK Compatibility Ideographs
        (code >= 0xFE_30 && code <= 0xFE_4F) || // CJK Compatibility Forms
        // Fullwidth ASCII and Punctuation (FF01-FF5E are fullwidth ASCII)
        (code >= 0xFF_01 && code <= 0xFF_5E) ||
        // Fullwidth brackets and symbols
        (code >= 0xFF_5F && code <= 0xFF_60)
    );
}

export function clearMultilineCache(): void {
    resultCache.clear();
    hyperMaps.clear();
    fullwidthAvgSize.clear();
    metrics.clear();
}

function backProp(
    text: string,
    realWidth: number,
    keyMap: Map<string, number>,
    temperature: number,
    avgSize: number
): void {
    let guessWidth = 0;
    const contribMap: Record<string, number> = {};
    for (const char of text) {
        const v = keyMap.get(char) ?? avgSize;
        guessWidth += v;
        contribMap[char] = (contribMap[char] ?? 0) + 1;
    }

    const diff = realWidth - guessWidth;

    for (const key of Object.keys(contribMap)) {
        const numContribution = contribMap[key];
        const contribWidth = keyMap.get(key) ?? avgSize;
        const contribAmount = (contribWidth * numContribution) / guessWidth;
        const adjustment = (diff * contribAmount * temperature) / numContribution;
        const newVal = contribWidth + adjustment;
        keyMap.set(key, newVal);
    }
}

function makeHyperMap(ctx: CanvasRenderingContext2D, avgSize: number, fontStyle: string): Map<string, number> {
    const result: Map<string, number> = new Map();
    let latinTotal = 0;
    let latinCount = 0;
    let fullwidthTotal = 0;
    let fullwidthCount = 0;

    // Latin/halfwidth characters (半角)
    const latinChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890,.-+=?";

    // Fullwidth characters (全角) - just need a few samples since all fullwidth chars have same width
    // Hiragana sample
    const hiraganaSample = "あいうえお";
    // Katakana sample
    const katakanaSample = "アイウエオ";
    // Kanji sample
    const kanjiSample = "日本語漢字";
    // Fullwidth punctuation
    const fullwidthPunctuation = "。、「」";

    const fullwidthChars = hiraganaSample + katakanaSample + kanjiSample + fullwidthPunctuation;

    // Measure Latin characters (半角)
    for (const char of latinChars) {
        const w = ctx.measureText(char).width;
        result.set(char, w);
        latinTotal += w;
        latinCount++;
    }

    // Measure fullwidth characters (全角)
    for (const char of fullwidthChars) {
        const w = ctx.measureText(char).width;
        result.set(char, w);
        fullwidthTotal += w;
        fullwidthCount++;
    }

    // Store fullwidth average for fallback on unmapped fullwidth characters
    // All fullwidth chars have the same width, so this average is accurate
    if (fullwidthCount > 0) {
        fullwidthAvgSize.set(fontStyle, fullwidthTotal / fullwidthCount);
    }

    const total = latinTotal + fullwidthTotal;
    const avg = total / result.size;

    // Artisanal hand-tuned constants that have no real meaning other than they make it work better for most fonts.
    // These don't really need to be accurate, we are going to be adjusting the weights. It just converges faster
    // if they start somewhere close.
    const damper = 3;
    const scaler = (avgSize / avg + damper) / (damper + 1);
    const keys = result.keys();
    for (const key of keys) {
        result.set(key, (result.get(key) ?? avg) * scaler);
    }
    return result;
}

function measureText(ctx: CanvasRenderingContext2D, text: string, fontStyle: string, hyperMode: boolean): number {
    // ✅ CRITICAL FIX: Set font before ANY measureText calls
    // Without this, ctx.font may be stale from previous render operations,
    // causing incorrect text width measurements and wrong line wrapping
    ctx.font = fontStyle;

    const current = metrics.get(fontStyle);

    if (hyperMode && current !== undefined && current.count > 20_000) {
        let hyperMap = hyperMaps.get(fontStyle);
        if (hyperMap === undefined) {
            hyperMap = makeHyperMap(ctx, current.size, fontStyle);
            hyperMaps.set(fontStyle, hyperMap);
        }

        if (current.count > 500_000) {
            let final = 0;
            // Fullwidth chars (全角) are typically 2x the width of halfwidth (半角)
            const fullwidthFallback = fullwidthAvgSize.get(fontStyle) ?? current.size * 2;
            for (const char of text) {
                const cached = hyperMap.get(char);
                if (cached !== undefined) {
                    final += cached;
                } else if (isFullwidthChar(char)) {
                    // All fullwidth characters have the same width
                    final += fullwidthFallback;
                } else {
                    // Halfwidth characters (including unknown chars)
                    final += current.size;
                }
            }
            return final * 1.01; // safety margin
        }

        const result = ctx.measureText(text);
        backProp(text, result.width, hyperMap, Math.max(0.05, 1 - current.count / 200_000), current.size);
        metrics.set(fontStyle, {
            count: current.count + text.length,
            size: current.size,
        });
        return result.width;
    }

    const result = ctx.measureText(text);

    const avg = result.width / text.length;

    // we've collected enough data
    if ((current?.count ?? 0) > 20_000) {
        return result.width;
    }

    if (current === undefined) {
        metrics.set(fontStyle, {
            count: text.length,
            size: avg,
        });
    } else {
        const diff = avg - current.size;
        const contribution = text.length / (current.count + text.length);
        const newVal = current.size + diff * contribution;
        metrics.set(fontStyle, {
            count: current.count + text.length,
            size: newVal,
        });
    }

    return result.width;
}

function getSplitPoint(
    ctx: CanvasRenderingContext2D,
    text: string,
    width: number,
    fontStyle: string,
    totalWidth: number,
    measuredChars: number,
    hyperMode: boolean,
    getBreakOpportunities?: BreakCallback
): number {
    if (text.length <= 1) return text.length;

    // this should never happen, but we are protecting anyway
    if (totalWidth < width) return -1;

    let guess = Math.floor((width / totalWidth) * measuredChars);
    let guessWidth = measureText(ctx, text.slice(0, Math.max(0, guess)), fontStyle, hyperMode);

    const oppos = getBreakOpportunities?.(text);

    if (guessWidth === width) {
        // NAILED IT
    } else if (guessWidth < width) {
        while (guessWidth < width) {
            guess++;
            guessWidth = measureText(ctx, text.slice(0, Math.max(0, guess)), fontStyle, hyperMode);
        }
        guess--;
    } else {
        // we only need to check for spaces as we go back
        while (guessWidth > width) {
            const lastSpace = oppos !== undefined ? 0 : text.lastIndexOf(" ", guess - 1);
            if (lastSpace > 0) {
                guess = lastSpace;
            } else {
                guess--;
            }
            guessWidth = measureText(ctx, text.slice(0, Math.max(0, guess)), fontStyle, hyperMode);
        }
    }

    if (text[guess] !== " ") {
        let greedyBreak = 0;
        if (oppos === undefined) {
            greedyBreak = text.lastIndexOf(" ", guess);
        } else {
            for (const o of oppos) {
                if (o > guess) break;
                greedyBreak = o;
            }
        }
        if (greedyBreak > 0) {
            guess = greedyBreak;
        }
    }

    return guess;
}

// Algorithm improved from https://github.com/geongeorge/Canvas-Txt/blob/master/src/index.js
export function splitMultilineText(
    ctx: CanvasRenderingContext2D,
    value: string,
    fontStyle: string,
    width: number,
    hyperWrappingAllowed: boolean,
    getBreakOpportunities?: BreakCallback
): readonly string[] {
    const key = `${value}_${fontStyle}_${width}px`;
    const cacheResult = resultCache.get(key);
    if (cacheResult !== undefined) return cacheResult;

    if (width <= 0) {
        // dont render 0 width stuff
        return [];
    }

    let result: string[] = [];
    const encodedLines: string[] = value.split("\n");

    const fontMetrics = metrics.get(fontStyle);
    const hyperMode = hyperWrappingAllowed && fontMetrics !== undefined && fontMetrics.count > 20_000;

    for (let line of encodedLines) {
        // ✅ FIX: Always measure FULL line first to check if it fits
        // Previous bug: measured only safeLineGuess chars but pushed entire line
        let textWidth = measureText(ctx, line, fontStyle, hyperMode);
        let measuredChars = line.length;

        if (textWidth <= width) {
            // line fits, just push it
            result.push(line);
        } else {
            while (textWidth > width) {
                const splitPoint = getSplitPoint(
                    ctx,
                    line,
                    width,
                    fontStyle,
                    textWidth,
                    measuredChars,
                    hyperMode,
                    getBreakOpportunities
                );
                const subLine = line.slice(0, Math.max(0, splitPoint));

                line = line.slice(subLine.length);
                result.push(subLine);
                // ✅ FIX: Measure FULL remaining line, not just safeLineGuess
                textWidth = measureText(ctx, line, fontStyle, hyperMode);
                measuredChars = line.length;
            }
            if (textWidth > 0) {
                result.push(line);
            }
        }
    }

    result = result.map(l => l.trimEnd());
    resultCache.set(key, result);
    if (resultCache.size > 500) {
        // this is not technically LRU behavior but it works "close enough" and is much cheaper
        const first = resultCache.keys().next();
        if (first.done !== true) {
            const cacheKey = first.value;
            if (cacheKey !== undefined) {
                resultCache.delete(cacheKey);
            }
        }
    }
    return result;
}

export { clearMultilineCache as clearCache };
