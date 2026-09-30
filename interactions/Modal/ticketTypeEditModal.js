/**
 * Osthelia Discord Bot - Ticket type edit modal handler
 *
 * Saves the single field edited through `/ticket-config type edit`.
 *
 * @package Osthelia\Interactions\Modal
 */

import { MessageFlags } from 'discord.js';

const APPLY = {
    label: (patch, value) => { patch.label = value; },
    emoji: (patch, value) => { patch.emoji = value || null; },
    description: (patch, value) => { patch.description = value || null; },
    image: (patch, value) => { patch.imageUrl = value || null; },
    message: (patch, value) => { patch.message = value || null; }
};

export default {
    data: { name: 'ticketTypeEditModal' },
    async modal(interaction) {
        const [, typeId, field] = interaction.customId.split('_');
        const type = Osthelia.ticketData.getType(interaction.guildId, typeId);
        // eslint-disable-next-line security/detect-object-injection -- field is checked against APPLY with hasOwnProperty above
        const apply = Object.prototype.hasOwnProperty.call(APPLY, field) ? APPLY[field] : null;

        if (!type || !apply) {
            return interaction.reply({ content: 'That ticket type no longer exists.', flags: MessageFlags.Ephemeral });
        }

        const value = interaction.fields.getTextInputValue('value').trim();

        if (field === 'label' && value.length === 0) {
            return interaction.reply({ content: 'Label cannot be empty.', flags: MessageFlags.Ephemeral });
        }

        const patch = { ...type };
        apply(patch, value);

        Osthelia.ticketData.upsertType(interaction.guildId, patch);

        return interaction.reply({ content: `Ticket type \`${typeId}\` updated.`, flags: MessageFlags.Ephemeral });
    }
};
