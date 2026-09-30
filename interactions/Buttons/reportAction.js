/**
 * Osthelia Discord Bot - Report resolve/dismiss buttons
 *
 * @package Osthelia\Interactions\Buttons
 */

import { PermissionFlagsBits, MessageFlags } from 'discord.js';

export default {
    data: { name: 'reportAction' },
    async button(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: 'You do not have permission to manage reports.', flags: MessageFlags.Ephemeral });
        }

        const [, action] = interaction.customId.split('_');
        const embed = interaction.message.embeds[0];
        const label = action === 'resolve' ? 'Resolved' : 'Dismissed';

        const updatedEmbed = { ...embed.data, footer: { text: `${label} by ${interaction.user.tag}` } };

        await interaction.update({ embeds: [updatedEmbed], components: [] });
    }
};
