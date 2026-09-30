/**
 * Osthelia Discord Bot - Ticket claim/add/close/reopen/delete buttons
 *
 * Close and delete only prompt for confirmation here, the actual action
 * runs from the ticketConfirm buttons.
 *
 * @package Osthelia\Interactions\Buttons
 */

export default {
    data: { name: 'ticketActions' },
    async button(interaction) {
        const [, action] = interaction.customId.split('_');

        if (action === 'claim') return Osthelia.ticketManager.claimTicket(interaction);
        if (action === 'add') return Osthelia.ticketManager.promptAddRole(interaction);
        if (action === 'close') return Osthelia.ticketManager.promptCloseConfirm(interaction, null);
        if (action === 'reopen') return Osthelia.ticketManager.reopenTicket(interaction);
        if (action === 'delete') return Osthelia.ticketManager.promptDeleteConfirm(interaction);
    }
};
