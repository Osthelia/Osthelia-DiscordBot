/**
 * Osthelia Discord Bot - Report message context menu command
 *
 * Lets any member report a message for moderator review. Right click a
 * message, Apps, Report Message.
 *
 * @package Osthelia\Interactions\ContextMenu
 */

import { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
    data: new ContextMenuCommandBuilder()
        .setName('Report Message')
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId(`reportModal_${interaction.targetId}`)
            .setTitle('Report message');

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Why are you reporting this message?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

        await interaction.showModal(modal);
    }
};
