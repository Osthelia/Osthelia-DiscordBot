/**
 * Osthelia Discord Bot - Standalone text card generator
 *
 * Generates a text-only image in the style of the join card.
 *
 * Usage: node textCard.js "Your text" [output.png]
 *
 * @package Osthelia
 */

import { createCanvas } from '@napi-rs/canvas';
import { writeFile } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// cardTheme.js registers the font from global.__basedir at import time.
global.__basedir = dirname(fileURLToPath(import.meta.url));

const {
    WIDTH, HEIGHT, PADDING,
    COLOR_ACCENT, COLOR_ACCENT_LIGHT, COLOR_TEXT,
    SERIF, withGlow, truncateToWidth, drawSparkle, drawCardBackground
} = await import('./modules/cardTheme.js');

const MAX_TEXT_WIDTH = WIDTH - PADDING * 2 - 120;
const MAX_FONT_SIZE = 56;
const MIN_FONT_SIZE = 28;
const LINE_HEIGHT_RATIO = 1.25;
const MAX_LINES = 4;

function wrapText(ctx, text, maxWidth) {
    const lines = [];

    for (const paragraph of text.split('\n')) {
        let line = '';

        for (const word of paragraph.split(/\s+/).filter(Boolean)) {
            const candidate = line ? `${line} ${word}` : word;

            if (line && ctx.measureText(candidate).width > maxWidth) {
                lines.push(line);
                line = word;
            } else {
                line = candidate;
            }
        }

        lines.push(line);
    }

    return lines;
}

function layoutText(ctx, text) {
    let layout = null;

    for (let size = MAX_FONT_SIZE; size >= MIN_FONT_SIZE; size -= 2) {
        ctx.font = `600 ${size}px "${SERIF}"`;
        layout = { size, lines: wrapText(ctx, text, MAX_TEXT_WIDTH) };

        if (layout.lines.length <= MAX_LINES && layout.lines.length * size * LINE_HEIGHT_RATIO <= HEIGHT - PADDING * 2) break;
    }

    if (layout.lines.length > MAX_LINES) {
        layout.lines = layout.lines.slice(0, MAX_LINES);
        layout.lines[MAX_LINES - 1] = truncateToWidth(ctx, `${layout.lines[MAX_LINES - 1]}…`, MAX_TEXT_WIDTH);
    }

    return layout;
}

function drawDecorativeSparkles(ctx) {
    const sparkles = [
        { x: 70, y: 60, size: 15, color: COLOR_ACCENT, opacity: 0.5 },
        { x: 130, y: 215, size: 9, color: COLOR_ACCENT_LIGHT, opacity: 0.35 },
        { x: WIDTH - 75, y: 70, size: 10, color: COLOR_ACCENT_LIGHT, opacity: 0.35 },
        { x: WIDTH - 130, y: 205, size: 18, color: COLOR_ACCENT, opacity: 0.45 },
        { x: WIDTH - 50, y: 150, size: 6, color: COLOR_ACCENT_LIGHT, opacity: 0.25 }
    ];

    for (const sparkle of sparkles) {
        ctx.save();
        ctx.globalAlpha = sparkle.opacity;
        withGlow(ctx, 'rgba(155, 92, 255, 0.6)', 10, () => {
            drawSparkle(ctx, sparkle.x, sparkle.y, sparkle.size, sparkle.color);
        });
        ctx.restore();
    }
}

const [text, output = 'text.png'] = process.argv.slice(2);

if (!text) {
    console.error('Usage: node textCard.js "Your text" [output.png]');
    process.exit(1);
}

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

drawCardBackground(ctx, WIDTH / 2, HEIGHT / 2);
drawDecorativeSparkles(ctx);

const { size, lines } = layoutText(ctx, text.replace(/\\n/g, '\n').trim());
const lineHeight = size * LINE_HEIGHT_RATIO;
const firstBaseline = (HEIGHT - lines.length * lineHeight) / 2 + lineHeight * 0.8;

ctx.textAlign = 'center';
ctx.font = `600 ${size}px "${SERIF}"`;
ctx.fillStyle = COLOR_TEXT;

withGlow(ctx, 'rgba(214, 184, 255, 0.5)', 14, () => {
    lines.forEach((line, index) => {
        ctx.fillText(line, WIDTH / 2, firstBaseline + index * lineHeight);
    });
});

await writeFile(output, await canvas.encode('png'));
console.log(`Image saved to ${output}`);
