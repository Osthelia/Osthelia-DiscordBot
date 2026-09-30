/**
 * Osthelia Discord Bot - Kick modal handler
 *
 * @package Osthelia\Interactions\Modal
 */

import { MessageFlags } from 'discord.js';

export default {
    data: { name: 'kickModal' },
    async modal(interaction) {
        const [, userId] = interaction.customId.split('_');
        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'This member is no longer in the server.', flags: MessageFlags.Ephemeral });
        }

        const reason = interaction.fields.getTextInputValue('reason');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await Osthelia.moderationActions.kick(member, reason);
        await interaction.editReply(`${member.user.tag} has been kicked.`);
    }
};
