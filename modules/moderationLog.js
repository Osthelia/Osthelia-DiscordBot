/**
 * Osthelia Discord Bot - Moderation log embeds
 *
 * Builds and sends the embeds posted to the configured log channel for
 * every moderation related event (joins, leaves, bans, voice activity,
 * message edits and deletions, nickname changes, timeouts).
 *
 * @package Osthelia\Modules
 */

import { EmbedBuilder } from 'discord.js';

const COLORS = {
    join: 0x57F287,
    leave: 0xED4245,
    kick: 0xED4245,
    ban: 0xED4245,
    unban: 0x57F287,
    nickname: 0xFEE75C,
    timeout: 0xFEE75C,
    voice: 0x5865F2,
    messageDelete: 0xED4245,
    messageEdit: 0xFEE75C
};

// sourceChannel is the channel the message was posted in, used to skip
// logging for categories excluded with /config message-log exclude-category,
// unless that channel was added to the ignore list with include-channel.
async function send(guild, embed, sourceChannel = null) {
    const config = Osthelia.database.get(guild.id);
    if (!config.logChannelId) return;

    if (sourceChannel) {
        const categoryExcluded = config.messageLog.exemptCategoryIds.includes(sourceChannel.parentId);
        const included = config.messageLog.includeChannelIds.includes(sourceChannel.id);
        if (categoryExcluded && !included) return;
    }

    const channel = await guild.channels.fetch(config.logChannelId).catch(() => null);
    if (!channel) return;

    await channel.send({ embeds: [embed] }).catch(() => null);
}

function baseEmbed(color) {
    return new EmbedBuilder().setColor(color).setTimestamp();
}

export default {
    async memberJoin(member) {
        const embed = baseEmbed(COLORS.join)
            .setTitle('Member joined')
            .setDescription(`${member} (${member.user.tag})`)
            .addFields({ name: 'Account created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` });

        await send(member.guild, embed);
    },
    async memberLeave(member) {
        const embed = baseEmbed(COLORS.leave)
            .setTitle('Member left')
            .setDescription(`${member.user.tag} (${member.id})`);

        await send(member.guild, embed);
    },
    async memberKicked(guild, user, executor, reason) {
        const embed = baseEmbed(COLORS.kick)
            .setTitle('Member kicked')
            .setDescription(`${user.tag} (${user.id})`)
            .addFields(
                { name: 'Moderator', value: executor ? `${executor}` : 'Unknown', inline: true },
                { name: 'Reason', value: reason || 'No reason provided', inline: true }
            );

        await send(guild, embed);
    },
    async memberBanned(guild, user, executor, reason) {
        const embed = baseEmbed(COLORS.ban)
            .setTitle('Member banned')
            .setDescription(`${user.tag} (${user.id})`)
            .addFields(
                { name: 'Moderator', value: executor ? `${executor}` : 'Unknown', inline: true },
                { name: 'Reason', value: reason || 'No reason provided', inline: true }
            );

        await send(guild, embed);
    },
    async memberUnbanned(guild, user, executor) {
        const embed = baseEmbed(COLORS.unban)
            .setTitle('Member unbanned')
            .setDescription(`${user.tag} (${user.id})`)
            .addFields({ name: 'Moderator', value: executor ? `${executor}` : 'Unknown', inline: true });

        await send(guild, embed);
    },
    async memberTimeout(guild, user, executor, until, reason) {
        const embed = baseEmbed(COLORS.timeout)
            .setTitle('Member muted')
            .setDescription(`${user.tag} (${user.id})`)
            .addFields(
                { name: 'Moderator', value: executor ? `${executor}` : 'Unknown', inline: true },
                { name: 'Until', value: `<t:${Math.floor(until / 1000)}:F>`, inline: true },
                { name: 'Reason', value: reason || 'No reason provided' }
            );

        await send(guild, embed);
    },
    async nicknameChange(member, oldNickname, newNickname) {
        const embed = baseEmbed(COLORS.nickname)
            .setTitle('Nickname changed')
            .setDescription(`${member}`)
            .addFields(
                { name: 'Before', value: oldNickname || member.user.username, inline: true },
                { name: 'After', value: newNickname || member.user.username, inline: true }
            );

        await send(member.guild, embed);
    },
    async voiceJoin(member, channel) {
        const embed = baseEmbed(COLORS.voice)
            .setTitle('Voice channel joined')
            .setDescription(`${member} joined ${channel}`);

        await send(member.guild, embed);
    },
    async voiceLeave(member, channel) {
        const embed = baseEmbed(COLORS.voice)
            .setTitle('Voice channel left')
            .setDescription(`${member} left ${channel}`);

        await send(member.guild, embed);
    },
    async voiceMove(member, fromChannel, toChannel) {
        const embed = baseEmbed(COLORS.voice)
            .setTitle('Voice channel switched')
            .setDescription(`${member} moved from ${fromChannel} to ${toChannel}`);

        await send(member.guild, embed);
    },
    async messageDelete(message) {
        const embed = baseEmbed(COLORS.messageDelete)
            .setTitle('Message deleted')
            .setDescription(`Author: ${message.author ? message.author.tag : 'Unknown'}\nChannel: ${message.channel}`)
            .addFields({ name: 'Content', value: message.content ? message.content.slice(0, 1024) : '*No text content*' });

        await send(message.guild, embed, message.channel);
    },
    async messageEdit(oldMessage, newMessage) {
        const embed = baseEmbed(COLORS.messageEdit)
            .setTitle('Message edited')
            .setDescription(`Author: ${newMessage.author ? newMessage.author.tag : 'Unknown'}\nChannel: ${newMessage.channel}`)
            .addFields(
                { name: 'Before', value: oldMessage.content ? oldMessage.content.slice(0, 1024) : '*Unknown*' },
                { name: 'After', value: newMessage.content ? newMessage.content.slice(0, 1024) : '*No text content*' }
            );

        await send(newMessage.guild, embed, newMessage.channel);
    }
};
