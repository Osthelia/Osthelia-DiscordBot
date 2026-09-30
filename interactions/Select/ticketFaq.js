/**
 * Osthelia Discord Bot - Ticket FAQ category select menu
 *
 * Posted inside a freshly opened ticket, before it has a type. Picking a
 * category resolves the ticket right away, or shows a form modal first
 * if that category has questions.
 *
 * @package Osthelia\Interactions\Select
 */

import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';

export default {
    data: { name: 'ticketFaq' },
    async select(interaction) {
        const typeId = interaction.values[0];
        const type = Osthelia.ticketData.getType(interaction.guildId, typeId);

        if (!type || !type.enabled) {
            return interaction.reply({ content: 'This category is no longer available.', flags: MessageFlags.Ephemeral });
        }

        if (type.form.length === 0) {
            return Osthelia.ticketManager.resolveTicketType(interaction, type);
        }

        const modal = new ModalBuilder()
            .setCustomId(`ticketForm_${type.id}`)
            .setTitle(type.label.slice(0, 45));

        type.form.forEach((question, index) => {
            const input = new TextInputBuilder()
                .setCustomId(`q${index}`)
                .setLabel(question.label)
                .setStyle(question.style === 'short' ? TextInputStyle.Short : TextInputStyle.Paragraph)
                .setRequired(question.required)
                .setMaxLength(question.style === 'short' ? 100 : 1000);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
        });

        await interaction.showModal(modal);
    }
};
