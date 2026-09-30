/**
 * Osthelia Discord Bot - Ticket form modal handler
 *
 * Receives the answers submitted from the FAQ category form and resolves
 * the pending ticket to that category.
 *
 * @package Osthelia\Interactions\Modal
 */

import { MessageFlags } from 'discord.js';

export default {
    data: { name: 'ticketForm' },
    async modal(interaction) {
        const [, typeId] = interaction.customId.split('_');
        const type = Osthelia.ticketData.getType(interaction.guildId, typeId);

        if (!type || !type.enabled) {
            return interaction.reply({ content: 'This category is no longer available.', flags: MessageFlags.Ephemeral });
        }

        const answers = type.form.map((question, index) => ({
            label: question.label,
            value: interaction.fields.getTextInputValue(`q${index}`)
        }));

        await Osthelia.ticketManager.resolveTicketType(interaction, type, answers);
    }
};
