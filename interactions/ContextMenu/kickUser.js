/**
 * Osthelia Discord Bot - Kick context menu command
 *
 * Right click a member, Apps, Kick.
 *
 * @package Osthelia\Interactions\ContextMenu
 */

import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';

export default {
    data: new ContextMenuCommandBuilder()
        .setName('Kick')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const target = interaction.targetMember;

        if (!target) {
            return interaction.reply({ content: 'This member is no longer in the server.', flags: MessageFlags.Ephemeral });
        }

        if (!target.kickable) {
            return interaction.reply({ content: 'I cannot kick this member.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId(`kickModal_${target.id}`)
            .setTitle(`Kick ${target.user.tag}`);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Reason')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

        await interaction.showModal(modal);
    }
};
