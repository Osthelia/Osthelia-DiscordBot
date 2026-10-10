/**
 * Osthelia Discord Bot - Join card image generation
 *
 * Draws a welcome image (avatar, member name, guild name) sent when a
 * member joins, sharing the same look as the /rank card (deep purple
 * background, violet glow, Cormorant Garamond serif).
 *
 * @package Osthelia\Modules
 */

import { createCanvas } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';
import {
    WIDTH, HEIGHT, PADDING, AVATAR_SIZE,
    COLOR_ACCENT, COLOR_ACCENT_LIGHT, COLOR_TEXT, COLOR_SUBTEXT, SERIF,
    withGlow, fitFontSize, truncateToWidth, drawSparkle, drawCardBackground, drawAvatar
} from './cardTheme.js';

function drawDecorativeMotif(ctx, x) {
    const sparkles = [
        { x: x + 70, y: 68, size: 15, color: COLOR_ACCENT, opacity: 0.5 },
        { x: x + 190, y: 50, size: 8, color: COLOR_ACCENT_LIGHT, opacity: 0.35 },
        { x: x + 130, y: 130, size: 20, color: COLOR_ACCENT, opacity: 0.4 },
        { x: x + 210, y: 175, size: 10, color: COLOR_ACCENT_LIGHT, opacity: 0.3 },
        { x: x + 55, y: 205, size: 12, color: COLOR_ACCENT, opacity: 0.45 },
        { x: x + 245, y: 110, size: 6, color: COLOR_ACCENT_LIGHT, opacity: 0.25 }
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

function drawWelcomeText(ctx, member, x, maxWidth) {
    withGlow(ctx, 'rgba(155, 92, 255, 0.8)', 10, () => {
        drawSparkle(ctx, x + 8, 78, 9, COLOR_ACCENT);
    });

    const nameFont = size => `600 ${size}px "${SERIF}"`;
    const nameSize = fitFontSize(ctx, member.displayName, nameFont, maxWidth - 26, 44, 26);
    const name = truncateToWidth(ctx, member.displayName, maxWidth - 26);

    withGlow(ctx, 'rgba(214, 184, 255, 0.5)', 14, () => {
        ctx.fillStyle = COLOR_TEXT;
        ctx.font = nameFont(nameSize);
        ctx.fillText(name, x + 26, 96);
    });

    ctx.fillStyle = COLOR_SUBTEXT;
    ctx.font = '20px sans-serif';
    ctx.fillText(truncateToWidth(ctx, `Welcome to ${member.guild.name}`, maxWidth), x, 130);

    ctx.fillStyle = COLOR_ACCENT_LIGHT;
    ctx.font = '600 22px sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText('Welcome!', x, 200);
    ctx.letterSpacing = '0px';
}

export default {
    async build(member) {
        const canvas = createCanvas(WIDTH, HEIGHT);
        const ctx = canvas.getContext('2d');

        drawCardBackground(ctx, PADDING + AVATAR_SIZE / 2, HEIGHT / 2);

        const avatarY = (HEIGHT - AVATAR_SIZE) / 2;
        await drawAvatar(ctx, member.displayAvatarURL({ extension: 'png', size: 256 }), PADDING, avatarY, AVATAR_SIZE);

        const textX = PADDING + AVATAR_SIZE + 45;
        const dividerX = 610;
        drawWelcomeText(ctx, member, textX, dividerX - textX - 20);
        drawDecorativeMotif(ctx, dividerX);

        return new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome.png' });
    }
};
