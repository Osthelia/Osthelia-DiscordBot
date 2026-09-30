/**
 * Osthelia Discord Bot - Rank card image generation
 *
 * Draws a level card (avatar, username, level, rank and XP progress bar)
 * used by the /rank command. The look and feel (deep purple background,
 * violet glow, Cormorant Garamond serif) matches osthelia.org.
 *
 * @package Osthelia\Modules
 */

import { createCanvas } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';
import {
    WIDTH, HEIGHT, PADDING, AVATAR_SIZE,
    COLOR_ACCENT, COLOR_ACCENT_LIGHT, COLOR_TEXT, COLOR_SUBTEXT, SERIF,
    drawRoundedRect, withGlow, fitFontSize, truncateToWidth, drawSparkle, drawCardBackground, drawAvatar
} from './cardTheme.js';

const COLOR_BAR_TRACK = 'rgba(255, 255, 255, 0.07)';

function drawIdentity(ctx, member, x, maxWidth) {
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
    ctx.fillText(truncateToWidth(ctx, member.user.tag, maxWidth), x, 130);
}

function drawStats(ctx, rankData) {
    ctx.textAlign = 'right';

    ctx.fillStyle = COLOR_SUBTEXT;
    ctx.font = '600 13px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('LEVEL', WIDTH - PADDING, 55);

    withGlow(ctx, 'rgba(214, 184, 255, 0.5)', 14, () => {
        ctx.fillStyle = COLOR_TEXT;
        ctx.font = `600 46px "${SERIF}"`;
        ctx.letterSpacing = '0px';
        ctx.fillText(`${rankData.level}`, WIDTH - PADDING, 100);
    });

    ctx.fillStyle = COLOR_ACCENT_LIGHT;
    ctx.font = '600 20px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(`RANK #${rankData.rank}`, WIDTH - PADDING, 130);

    ctx.textAlign = 'left';
    ctx.letterSpacing = '0px';
}

function drawProgressBar(ctx, x, y, width, rankData) {
    const height = 34;
    const progress = Math.min(rankData.xpIntoLevel / rankData.xpForNextLevel, 1);

    drawRoundedRect(ctx, x, y, width, height, height / 2);
    ctx.fillStyle = COLOR_BAR_TRACK;
    ctx.fill();

    if (progress > 0) {
        const fillWidth = Math.max(width * progress, height);

        withGlow(ctx, 'rgba(155, 92, 255, 0.6)', 16, () => {
            const gradient = ctx.createLinearGradient(x, 0, x + fillWidth, 0);
            gradient.addColorStop(0, COLOR_ACCENT);
            gradient.addColorStop(1, COLOR_ACCENT_LIGHT);

            drawRoundedRect(ctx, x, y, fillWidth, height, height / 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }

    ctx.fillStyle = COLOR_SUBTEXT;
    ctx.font = '600 16px sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(`${rankData.xpIntoLevel} / ${rankData.xpForNextLevel} XP`, x, y + height + 30);
    ctx.letterSpacing = '0px';
}

export default {
    async build(member, rankData) {
        const canvas = createCanvas(WIDTH, HEIGHT);
        const ctx = canvas.getContext('2d');

        drawCardBackground(ctx, PADDING + AVATAR_SIZE / 2, HEIGHT / 2);

        const avatarY = (HEIGHT - AVATAR_SIZE) / 2;
        await drawAvatar(ctx, member.displayAvatarURL({ extension: 'png', size: 256 }), PADDING, avatarY, AVATAR_SIZE);

        const textX = PADDING + AVATAR_SIZE + 45;
        const statsWidth = 170;
        drawIdentity(ctx, member, textX, WIDTH - PADDING - statsWidth - textX);
        drawStats(ctx, rankData);
        drawProgressBar(ctx, textX, 185, WIDTH - PADDING - textX, rankData);

        return new AttachmentBuilder(await canvas.encode('png'), { name: 'rank.png' });
    }
};
