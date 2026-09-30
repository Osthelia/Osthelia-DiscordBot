/**
 * Osthelia Discord Bot - Ticket type edit field picker
 *
 * Shown after `/ticket-config type edit`, lets an admin pick which field
 * to change. Discord modals cannot contain a dropdown, so picking a
 * field here is what opens the modal for it, pre-filled with its
 * current value.
 *
 * @package Osthelia\Interactions\Select
 */

import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';

const FIELDS = {
    label: { title: 'Label', currentValue: type => type.label, style: TextInputStyle.Short, maxLength: 256, required: true },
    emoji: { title: 'Emoji', currentValue: type => type.emoji, style: TextInputStyle.Short, maxLength: 256, required: false },
    description: { title: 'Description', currentValue: type => type.description, style: TextInputStyle.Paragraph, maxLength: 100, required: false },
    image: { title: 'Banner image URL', currentValue: type => type.imageUrl, style: TextInputStyle.Short, maxLength: 256, required: false },
    message: {
        title: 'Ticket message',
        currentValue: type => type.message,
        style: TextInputStyle.Paragraph,
        maxLength: 1500,
        required: false,
        placeholder: 'Use {member} to ping the ticket opener'
    }
};

export default {
    data: { name: 'ticketTypeEditField' },
    async select(interaction) {
        const [, typeId] = interaction.customId.split('_');
        const field = interaction.values[0];
        // eslint-disable-next-line security/detect-object-injection -- field is checked against FIELDS with hasOwnProperty above
        const spec = Object.prototype.hasOwnProperty.call(FIELDS, field) ? FIELDS[field] : null;
        const type = Osthelia.ticketData.getType(interaction.guildId, typeId);

        if (!type || !spec) {
            return interaction.reply({ content: 'That ticket type no longer exists.', flags: MessageFlags.Ephemeral });
        }

        const currentValue = spec.currentValue(type);
        const maxLength = spec.maxLength;

        const modal = new ModalBuilder()
            .setCustomId(`ticketTypeEditModal_${typeId}_${field}`)
            .setTitle(`Edit ${spec.title}`);

        const input = new TextInputBuilder()
            .setCustomId('value')
            .setLabel(spec.title)
            .setStyle(spec.style)
            .setRequired(spec.required)
            .setMaxLength(maxLength);

        if (spec.placeholder) input.setPlaceholder(spec.placeholder);
        if (currentValue) input.setValue(String(currentValue).slice(0, maxLength));

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        await interaction.showModal(modal);
    }
};
