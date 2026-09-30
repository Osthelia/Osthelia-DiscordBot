/**
 * Osthelia Discord Bot - Ticket panel open button
 *
 * @package Osthelia\Interactions\Buttons
 */

export default {
    data: { name: 'ticketPanel' },
    async button(interaction) {
        await Osthelia.ticketManager.createPendingTicket(interaction);
    }
};
