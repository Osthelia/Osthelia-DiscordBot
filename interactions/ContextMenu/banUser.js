/**
 * Osthelia Discord Bot - Ban context menu command
 *
 * Right click a member, Apps, Ban.
 *
 * @package Osthelia\Interactions\ContextMenu
 */

import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';

export default {
    data: new ContextMenuCommandBuilder()
        .setName('Ban')
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const target = interaction.targetMember;

        if (!target) {
            return interaction.reply({ content: 'This member is no longer in the server.', flags: MessageFlags.Ephemeral });
        }

        if (!target.bannable) {
            return interaction.reply({ content: 'I cannot ban this member.', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId(`banModal_${target.id}`)
            .setTitle(`Ban ${target.user.tag}`);

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
