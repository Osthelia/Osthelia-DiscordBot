/**
 * Osthelia Discord Bot - Message delete event
 *
 * @package Osthelia\Events
 */

export default {
    type: 'messageDelete',
    async callback(message) {
        if (!message.guild || message.author?.bot) return;

        await Osthelia.moderationLog.messageDelete(message);
    }
};
