/**
 * Osthelia Discord Bot - Auto moderation
 *
 * Deletes messages containing links that are not on the guild's allow
 * list, unless the message was posted in an exempt channel or category,
 * by a member with an exempt role, or by a member who can manage
 * messages.
 *
 * @package Osthelia\Modules
 */

import { PermissionFlagsBits } from 'discord.js';

const URL_PATTERN = /https?:\/\/[^\s]+/gi;

function extractHostnames(content) {
    const matches = content.match(URL_PATTERN) || [];

    return matches
        .map(url => {
            try {
                return new URL(url).hostname.toLowerCase();
            } catch {
                return null;
            }
        })
        .filter(Boolean);
}

function isAllowedHostname(hostname, allowedDomains) {
    return allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}

function isExempt(message, autoMod) {
    if (autoMod.exemptChannelIds.includes(message.channel.id)) return true;
    if (autoMod.exemptCategoryIds.includes(message.channel.parentId)) return true;
    if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;

    return message.member.roles.cache.some(role => autoMod.exemptRoleIds.includes(role.id));
}

export default {
    async handleMessage(message) {
        const config = Osthelia.database.get(message.guild.id);
        if (!config.autoMod.enabled) return false;
        if (isExempt(message, config.autoMod)) return false;

        const hostnames = extractHostnames(message.content);
        if (hostnames.length === 0) return false;

        const hasDisallowedLink = hostnames.some(hostname => !isAllowedHostname(hostname, config.autoMod.allowedDomains));
        if (!hasDisallowedLink) return false;

        await message.delete().catch(() => null);

        const warning = await message.channel.send(`${message.author}, links are not allowed in this channel.`);
        setTimeout(() => warning.delete().catch(() => null), 5000);

        return true;
    }
};
