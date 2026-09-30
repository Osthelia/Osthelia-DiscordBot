/**
 * Osthelia Discord Bot - Leveling system
 *
 * Awards XP for chat activity, tracks levels per guild member and applies
 * configured role rewards when a member levels up. A per-member cooldown,
 * a minimum content length and a repeated message check keep members
 * from farming XP by spamming.
 *
 * @package Osthelia\Modules
 */

const XP_COOLDOWN_MS = 60 * 1000;
const XP_MIN = 15;
const XP_MAX = 25;
const MIN_CONTENT_LENGTH = 3;

function xpRequiredForLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

function computeLevel(totalXp) {
    let level = 0;
    let remaining = totalXp;

    while (remaining >= xpRequiredForLevel(level)) {
        remaining -= xpRequiredForLevel(level);
        level++;
    }

    return { level, xpIntoLevel: remaining, xpForNextLevel: xpRequiredForLevel(level) };
}

function randomXp() {
    return Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
}

function isSpam(message, data) {
    const content = message.content.trim();
    const hasAttachment = message.attachments.size > 0 || message.stickers.size > 0;

    if (content.length < MIN_CONTENT_LENGTH && !hasAttachment) return true;
    if (content.length > 0 && content.toLowerCase() === data.lastContent.toLowerCase()) return true;

    return false;
}

async function applyRoleRewards(member, level, roleRewards) {
    const earnedRoleIds = roleRewards.filter(reward => reward.level <= level).map(reward => reward.roleId);

    for (const roleId of earnedRoleIds) {
        if (member.roles.cache.has(roleId)) continue;
        await member.roles.add(roleId).catch(() => null);
    }
}

export default {
    xpRequiredForLevel,
    computeLevel,
    async handleMessage(message) {
        const config = Osthelia.database.get(message.guild.id);
        if (!config.leveling.enabled) return;
        if (config.leveling.exemptChannelIds.includes(message.channel.id)) return;

        const userId = message.author.id;
        const data = Osthelia.levelData.getMember(message.guild.id, userId);

        const now = Date.now();
        if (now - data.lastMessageAt < XP_COOLDOWN_MS) return;

        const content = message.content.trim();
        if (isSpam(message, data)) {
            Osthelia.levelData.setMember(message.guild.id, userId, { ...data, lastContent: content });
            return;
        }

        const before = computeLevel(data.xp);
        const xp = data.xp + randomXp();
        const after = computeLevel(xp);

        Osthelia.levelData.setMember(message.guild.id, userId, { xp, lastMessageAt: now, lastContent: content });

        if (after.level <= before.level) return;

        await applyRoleRewards(message.member, after.level, config.leveling.roleRewards);

        await message.channel.send(`${message.author} just reached level **${after.level}**!`).catch(() => null);
    },
    getRank(guildId, userId) {
        const members = Osthelia.levelData.getAllMembers(guildId);
        const sorted = Object.entries(members).sort(([, a], [, b]) => b.xp - a.xp);
        const position = sorted.findIndex(([id]) => id === userId);

        // eslint-disable-next-line security/detect-object-injection
        const data = members[userId] || { xp: 0 };
        const level = computeLevel(data.xp);

        return {
            ...level,
            xp: data.xp,
            rank: position === -1 ? sorted.length + 1 : position + 1,
            totalMembers: sorted.length
        };
    },
    getLeaderboard(guildId, limit = 10) {
        const members = Osthelia.levelData.getAllMembers(guildId);

        return Object.entries(members)
            .sort(([, a], [, b]) => b.xp - a.xp)
            .slice(0, limit)
            .map(([userId, data], index) => ({ userId, xp: data.xp, rank: index + 1, ...computeLevel(data.xp) }));
    }
};
