/**
 * Osthelia Discord Bot - Shared card drawing theme
 *
 * Common colors, fonts and canvas helpers shared by every generated image
 * (rank card, join card, ...) so they all share the same look and feel as
 * osthelia.org: deep purple background, violet glow, Cormorant Garamond.
 *
 * @package Osthelia\Modules
 */

import { GlobalFonts, loadImage } from '@napi-rs/canvas';
import { join } from 'path';

GlobalFonts.registerFromPath(join(global.__basedir, 'assets', 'fonts', 'CormorantGaramond.ttf'), 'Cormorant Garamond');

export const WIDTH = 934;
export const HEIGHT = 282;
export const PADDING = 40;
export const AVATAR_SIZE = 190;
export const RADIUS = 24;

export const COLOR_BACKGROUND = '#0B0712';
export const COLOR_PANEL = '#140D22';
export const COLOR_BORDER = 'rgba(155, 92, 255, 0.35)';
export const COLOR_ACCENT = '#9B5CFF';
export const COLOR_ACCENT_LIGHT = '#D6B8FF';
export const COLOR_TEXT = '#FFFFFF';
export const COLOR_SUBTEXT = '#988DA7';
export const SERIF = 'Cormorant Garamond';

export function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
}

export function withGlow(ctx, color, blur, draw) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    draw();
    ctx.restore();
}

export function fitFontSize(ctx, text, font, maxWidth, startSize, minSize) {
    let size = startSize;

    while (size > minSize) {
        ctx.font = font(size);
        if (ctx.measureText(text).width <= maxWidth) break;
        size -= 2;
    }

    return size;
}

export function truncateToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;

    let truncated = text;
    while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }

    return `${truncated}…`;
}

export function drawSparkle(ctx, cx, cy, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + size * 0.15, cy - size * 0.15, cx + size, cy);
    ctx.quadraticCurveTo(cx + size * 0.15, cy + size * 0.15, cx, cy + size);
    ctx.quadraticCurveTo(cx - size * 0.15, cy + size * 0.15, cx - size, cy);
    ctx.quadraticCurveTo(cx - size * 0.15, cy - size * 0.15, cx, cy - size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export function drawCardBackground(ctx, glowX, glowY) {
    drawRoundedRect(ctx, 0, 0, WIDTH, HEIGHT, RADIUS);
    ctx.save();
    ctx.clip();

    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const glow = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, WIDTH * 0.6);
    glow.addColorStop(0, 'rgba(155, 92, 255, 0.22)');
    glow.addColorStop(1, 'rgba(155, 92, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = COLOR_PANEL;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;

    ctx.restore();

    drawRoundedRect(ctx, 0.75, 0.75, WIDTH - 1.5, HEIGHT - 1.5, RADIUS);
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

export async function drawAvatar(ctx, avatarUrl, x, y, size) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    withGlow(ctx, 'rgba(155, 92, 255, 0.8)', 22, () => {
        ctx.fillStyle = COLOR_ACCENT;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2 + 3, 0, Math.PI * 2);
        ctx.fill();
    });

    const avatarImage = await loadImage(avatarUrl);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, x, y, size, size);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR_ACCENT_LIGHT;
    ctx.lineWidth = 2;
    ctx.stroke();
}
