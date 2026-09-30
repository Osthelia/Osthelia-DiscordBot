/**
 * Osthelia Discord Bot - Ticket close/delete confirmation buttons
 *
 * @package Osthelia\Interactions\Buttons
 */

export default {
    data: { name: 'ticketConfirm' },
    async button(interaction) {
        const [, action] = interaction.customId.split('_');
        const [kind, decision] = action.split('-');

        if (decision === 'no') {
            return interaction.update({ content: 'Cancelled.', components: [] });
        }

        if (kind === 'close') return Osthelia.ticketManager.confirmClose(interaction);
        if (kind === 'delete') return Osthelia.ticketManager.confirmDelete(interaction);
    }
};
