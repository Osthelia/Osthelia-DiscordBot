/**
 * Osthelia Discord Bot - Report modal handler
 *
 * Receives the reason submitted from the Report Message context menu
 * and posts it to the configured report channel for review.
 *
 * @package Osthelia\Interactions\Modal
 */

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export default {
    data: { name: 'reportModal' },
    async modal(interaction) {
        const [, messageId] = interaction.customId.split('_');
        const config = Osthelia.database.get(interaction.guildId);

        if (!config.reportChannelId) {
            return interaction.reply({ content: 'No report channel has been configured yet, ask an administrator to run /config channel reports.', flags: MessageFlags.Ephemeral });
        }

        const reportChannel = await interaction.guild.channels.fetch(config.reportChannelId).catch(() => null);
        if (!reportChannel) {
            return interaction.reply({ content: 'The configured report channel could not be found.', flags: MessageFlags.Ephemeral });
        }

        const reportedMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
        const reason = interaction.fields.getTextInputValue('reason');
        const messageLink = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${messageId}`;

        const embed = new EmbedBuilder()
            .setTitle('Message reported')
            .setURL(messageLink)
            .setColor(0xED4245)
            .setTimestamp()
            .addFields(
                { name: 'Reported by', value: `${interaction.user}`, inline: true },
                { name: 'Channel', value: `${interaction.channel}`, inline: true },
                { name: 'Message link', value: `[Jump to message](${messageLink})` },
                { name: 'Reason', value: reason }
            );

        if (reportedMessage) {
            embed.addFields({ name: 'Message content', value: reportedMessage.content ? reportedMessage.content.slice(0, 1024) : '*No text content*' });
            embed.addFields({ name: 'Author', value: `${reportedMessage.author}` });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`reportAction_resolve_${messageId}`).setLabel('Resolve').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`reportAction_dismiss_${messageId}`).setLabel('Dismiss').setStyle(ButtonStyle.Secondary)
        );

        await reportChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Your report has been sent to the moderation team.', flags: MessageFlags.Ephemeral });
    }
};
