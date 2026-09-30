/**
 * Osthelia Discord Bot - Timeout context menu command
 *
 * Right click a member, Apps, Timeout. Uses Discord's native timeout
 * (communication disabled) feature instead of a mute role.
 *
 * @package Osthelia\Interactions\ContextMenu
 */

import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';

export default {
    data: new ContextMenuCommandBuilder()
        .setName('Timeout')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const target = interaction.targetMember;

        if (!target) {
            return interaction.reply({ content: 'This member is no longer in the server.', flags: MessageFlags.Ephemeral });
        }

        if (!target.moderatable) {
            return interaction.reply({ content: 'I cannot timeout this member.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId(`timeoutModal_${target.id}`)
            .setTitle(`Timeout ${target.user.tag}`);

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration in minutes')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(6);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Reason')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500);

        modal.addComponents(
            new ActionRowBuilder().addComponents(durationInput),
            new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
    }
};
