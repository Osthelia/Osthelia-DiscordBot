/**
 * Osthelia Discord Bot - Timeout modal handler
 *
 * @package Osthelia\Interactions\Modal
 */

import { MessageFlags } from 'discord.js';

const MAX_TIMEOUT_MINUTES = 40320; // Discord's 28 day limit

export default {
    data: { name: 'timeoutModal' },
    async modal(interaction) {
        const [, userId] = interaction.customId.split('_');
        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'This member is no longer in the server.', flags: MessageFlags.Ephemeral });
        }

        const duration = Number(interaction.fields.getTextInputValue('duration'));
        if (!Number.isInteger(duration) || duration < 1 || duration > MAX_TIMEOUT_MINUTES) {
            return interaction.reply({ content: `Duration must be a whole number between 1 and ${MAX_TIMEOUT_MINUTES} minutes.`, flags: MessageFlags.Ephemeral });
        }

        const reason = interaction.fields.getTextInputValue('reason');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await Osthelia.moderationActions.timeout(member, reason, duration);
        await interaction.editReply(`${member.user.tag} has been muted for ${duration} minutes.`);
    }
};
