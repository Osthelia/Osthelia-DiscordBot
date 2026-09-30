/**
 * Osthelia Discord Bot - Ticket quick add role select menu
 *
 * Shown ephemerally after clicking the Add button on a ticket, lets
 * staff grant one of the guild's predefined addable roles access to the
 * current ticket. Only reachable through that ephemeral prompt, which is
 * itself gated to staff for that ticket's type.
 *
 * @package Osthelia\Interactions\Select
 */

export default {
    data: { name: 'ticketAddRole' },
    async select(interaction) {
        const roleId = interaction.values[0];
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return interaction.update({ content: 'That role no longer exists.', components: [] });
        }

        await interaction.channel.permissionOverwrites.edit(role.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        await interaction.update({ content: `${role} has been added to this ticket.`, components: [] });
    }
};
